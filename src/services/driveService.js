// src/services/driveService.js

const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3/files";
const TARGET_FOLDER_ID = "1GyTPCza4yj37RwEtSr0wfah3Xe50Pb7z";

/**
 * Fetch files/folders directly inside the target KKM TW I Perwakilan folder.
 * Uses the accessToken obtained from GoogleAuthProvider during login.
 */
export async function fetchDriveContents(accessToken) {
    if (!accessToken) {
        throw new Error(
            "Access token Google tidak ditemukan. Silakan logout dan login kembali.",
        );
    }

    // Query: file yang parent-nya adalah TARGET_FOLDER_ID dan belum ditrash
    // Kami cuma butuh nama dan id untuk mapping ke daftar perwakilan
    const query = `'${TARGET_FOLDER_ID}' in parents and trashed = false`;
    const url = `${DRIVE_API_BASE}?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime)&pageSize=100`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            const errData = await response.json();

            if (response.status === 401 || response.status === 403) {
                if (errData?.error?.message?.includes("insufficient permissions")) {
                    throw new Error(
                        "Izin API Ditolak: Pastikan Google Drive API sudah diaktifkan di Google Cloud Console project Anda.",
                    );
                }
                throw new Error(
                    "Sesi Google kedaluwarsa atau akses ditolak. Silakan login ulang.",
                );
            }
            if (response.status === 404) {
                throw new Error(
                    "Folder tidak ditemukan. Pastikan akun email Anda memiliki akses baca ke folder tersebut.",
                );
            }
            throw new Error(
                errData?.error?.message || "Gagal mengambil data dari Google Drive",
            );
        }

        const data = await response.json();
        return data.files || [];
    } catch (err) {
        console.error("Error fetching drive API:", err);
        throw err;
    }
}

/**
 * Ambil daftar isi file dari dalam folder Google Drive, mengembalikan daftar namanya.
 */
export async function fetchFilesInsideFolder(accessToken, folderId) {
    if (!accessToken) return [];

    // Limit to 50 items to minimize payload. Trashed=false.
    // Query hanya mencari file yang berada langsung di dalam folder (parents in)
    const query = `'${folderId}' in parents and trashed = false`;
    const url = `${DRIVE_API_BASE}?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,shortcutDetails)&pageSize=50`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json",
            },
        });

        if (!response.ok) return [];

        const data = await response.json();
        return data.files || [];
    } catch (err) {
        console.error("Error fetching files inside folder:", err);
        return [];
    }
}

/**
 * Fetch recent activity for the target folder using Google Drive Activity API.
 */
export async function fetchDriveActivity(accessToken) {
    if (!accessToken) throw new Error("Access token required for Activity API");

    const ACTIVITY_API_URL =
        "https://driveactivity.googleapis.com/v2/activity:query";

    try {
        const response = await fetch(ACTIVITY_API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ancestorName: `items/${TARGET_FOLDER_ID}`,
                pageSize: 20,
            }),
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(
                errData?.error?.message || "Gagal mengambil aktivitas Google Drive",
            );
        }

        const data = await response.json();
        return data.activities || [];
    } catch (err) {
        console.error("Error fetching drive activity:", err);
        throw err;
    }
}

// Promise-based cache to prevent parallel duplicate API calls
const personCachePromises = {};

/**
 * Fetch a user's display name using their resource name (people/accountId)
 * via the Google People API with directory.readonly scope.
 * Uses Promise-based deduplication to prevent race conditions.
 */
export async function fetchPersonName(accessToken, personName) {
    if (!personName || !personName.startsWith('people/')) return "Kontributor";

    // If there's already a pending or resolved promise for this person, reuse it
    if (personCachePromises[personName]) {
        return personCachePromises[personName];
    }

    // Create and cache the promise BEFORE awaiting it (prevents race condition)
    const fetchPromise = (async () => {
        try {
            const url = `https://people.googleapis.com/v1/${personName}?personFields=names`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                const displayName = data.names?.[0]?.displayName;
                if (displayName) {
                    return displayName;
                }
            } else {
                const errData = await response.json().catch(() => ({}));
                console.warn(`[PersonAPI] ❌ ${personName} → HTTP ${response.status}:`, errData?.error?.message || 'unknown error');
                // If it's a permission error, don't retry (delete from cache so Promise doesn't persist as failure)
                if (response.status === 403 || response.status === 404) {
                    // Keep cache to avoid retrying known failures
                    return "Kontributor";
                }
                // For rate limit (429), clear cache so it can retry next cycle
                if (response.status === 429) {
                    delete personCachePromises[personName];
                    return "Kontributor";
                }
            }
        } catch (err) {
            console.warn("[PersonAPI] Network error:", err);
            delete personCachePromises[personName];
        }
        return "Kontributor";
    })();

    personCachePromises[personName] = fetchPromise;
    return fetchPromise;
}

