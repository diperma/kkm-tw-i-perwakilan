// src/services/driveService.js

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';
const TARGET_FOLDER_ID = '1GyTPCza4yj37RwEtSr0wfah3Xe50Pb7z';

/**
 * Fetch files/folders directly inside the target KKM TW I Perwakilan folder.
 * Uses the accessToken obtained from GoogleAuthProvider during login.
 */
export async function fetchDriveContents(accessToken) {
    if (!accessToken) {
        throw new Error('Access token Google tidak ditemukan. Silakan logout dan login kembali.');
    }

    // Query: file yang parent-nya adalah TARGET_FOLDER_ID dan belum ditrash
    // Kami cuma butuh nama dan id untuk mapping ke daftar perwakilan
    const query = `'${TARGET_FOLDER_ID}' in parents and trashed = false`;
    const url = `${DRIVE_API_BASE}?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime)&pageSize=100`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            const errData = await response.json();

            if (response.status === 401 || response.status === 403) {
                if (errData?.error?.message?.includes('insufficient permissions')) {
                    throw new Error('Izin API Ditolak: Pastikan Google Drive API sudah diaktifkan di Google Cloud Console project Anda.');
                }
                throw new Error('Sesi Google kedaluwarsa atau akses ditolak. Silakan login ulang.');
            }
            if (response.status === 404) {
                throw new Error('Folder tidak ditemukan. Pastikan akun email Anda memiliki akses baca ke folder tersebut.');
            }
            throw new Error(errData?.error?.message || 'Gagal mengambil data dari Google Drive');
        }

        const data = await response.json();
        return data.files || [];
    } catch (err) {
        console.error('Error fetching drive API:', err);
        throw err;
    }
}

/**
 * Check if a specific Google Drive folder contains at least one file/subfolder.
 */
export async function checkIfFolderHasFiles(accessToken, folderId) {
    if (!accessToken) return false;

    // Limit to 1 item to minimize payload. Trashed=false.
    const query = `'${folderId}' in parents and trashed = false`;
    const url = `${DRIVE_API_BASE}?q=${encodeURIComponent(query)}&fields=files(id)&pageSize=1`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            }
        });

        if (!response.ok) return false;

        const data = await response.json();
        return data.files && data.files.length > 0;
    } catch (err) {
        console.error('Error checking folder contents:', err);
        return false;
    }
}

/**
 * Fetch recent activity for the target folder using Google Drive Activity API.
 */
export async function fetchDriveActivity(accessToken) {
    if (!accessToken) throw new Error('Access token required for Activity API');

    const ACTIVITY_API_URL = 'https://driveactivity.googleapis.com/v2/activity:query';

    try {
        const response = await fetch(ACTIVITY_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ancestorName: `items/${TARGET_FOLDER_ID}`,
                pageSize: 20,
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData?.error?.message || 'Gagal mengambil aktivitas Google Drive');
        }

        const data = await response.json();
        return data.activities || [];
    } catch (err) {
        console.error('Error fetching drive activity:', err);
        throw err;
    }
}
