import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    addDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// ================================
// Data Perwakilan (36 kantor)
// ================================
const PERWAKILAN_DATA = [
    { id: 'PW01', name: 'Aceh' }, { id: 'PW02', name: 'Sumatera Utara' }, { id: 'PW03', name: 'Sumatera Barat' },
    { id: 'PW04', name: 'Riau' }, { id: 'PW05', name: 'Jambi' }, { id: 'PW06', name: 'Bengkulu' },
    { id: 'PW07', name: 'Sumatera Selatan' }, { id: 'PW08', name: 'Lampung' }, { id: 'PW09', name: 'DKI Jakarta' },
    { id: 'PW10', name: 'Jawa Barat' }, { id: 'PW11', name: 'Jawa Tengah' }, { id: 'PW12', name: 'DI Yogyakarta' },
    { id: 'PW13', name: 'Jawa Timur' }, { id: 'PW14', name: 'Kalimantan Barat' }, { id: 'PW15', name: 'Kalimantan Tengah' },
    { id: 'PW16', name: 'Kalimantan Selatan' }, { id: 'PW17', name: 'Kalimantan Timur' }, { id: 'PW18', name: 'Sulawesi Utara' },
    { id: 'PW19', name: 'Sulawesi Tengah' }, { id: 'PW20', name: 'Sulawesi Tenggara' }, { id: 'PW21', name: 'Sulawesi Selatan' },
    { id: 'PW22', name: 'Bali' }, { id: 'PW23', name: 'Nusa Tenggara Barat' }, { id: 'PW24', name: 'Nusa Tenggara Timur' },
    { id: 'PW25', name: 'Maluku' }, { id: 'PW26', name: 'Papua' }, { id: 'PW27', name: 'Papua Barat' },
    { id: 'PW28', name: 'Kepulauan Riau' }, { id: 'PW29', name: 'Kepulauan Bangka Belitung' }, { id: 'PW30', name: 'Banten' },
    { id: 'PW31', name: 'Gorontalo' }, { id: 'PW32', name: 'Sulawesi Barat' }, { id: 'PW33', name: 'Maluku Utara' },
    { id: 'PW34', name: 'Kalimantan Utara' }, { id: 'PW35', name: 'Papua Barat Daya' }, { id: 'PW36', name: 'Papua Tengah' }
];

// ================================
// Seed / Initialize Data
// ================================
export async function seedPerwakilan() {
    const colRef = collection(db, 'perwakilan');
    const snapshot = await getDocs(colRef);

    if (snapshot.size > 0) {
        console.log('Data sudah ada, skip seeding.');
        return false;
    }

    const promises = PERWAKILAN_DATA.map(item =>
        setDoc(doc(db, 'perwakilan', item.id), {
            id: item.id,
            name: item.name,
            status: 'missing',
            lastUpdated: null,
            createdAt: serverTimestamp()
        })
    );

    await Promise.all(promises);
    console.log('Seeding selesai: 36 perwakilan ditambahkan.');
    return true;
}

// ================================
// Real-time Listeners
// ================================
export function subscribePerwakilan(callback) {
    const colRef = collection(db, 'perwakilan');
    return onSnapshot(colRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));
        // Sort by ID
        data.sort((a, b) => a.id.localeCompare(b.id));
        callback(data);
    }, (error) => {
        console.error('Error listening to perwakilan:', error);
    });
}

export function subscribeActivityLogs(callback, maxItems = 20) {
    const colRef = collection(db, 'activityLogs');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(maxItems));

    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));
        callback(logs);
    }, (error) => {
        console.error('Error listening to activity logs:', error);
    });
}

// ================================
// Mutations
// ================================
export async function updatePwakilanStatus(pwId, status) {
    const docRef = doc(db, 'perwakilan', pwId);
    await updateDoc(docRef, {
        status,
        lastUpdated: status === 'submitted'
            ? new Date().toISOString().split('T')[0]
            : null
    });
}

export async function addActivityLog({ pwId, user, action, file }) {
    const colRef = collection(db, 'activityLogs');
    await addDoc(colRef, {
        pwId,
        user,
        action,
        file,
        createdAt: serverTimestamp()
    });
}

// ================================
// Fallback Data (offline / no Firebase)
// ================================
export function getFallbackPerwakilan() {
    return PERWAKILAN_DATA.map(item => ({
        ...item,
        status: Math.random() > 0.4 ? 'submitted' : 'missing',
        lastUpdated: Math.random() > 0.4
            ? `2026-02-${Math.floor(Math.random() * 20 + 1).toString().padStart(2, '0')}`
            : null
    }));
}

export function getFallbackActivityLogs() {
    return [
        { id: '1', pwId: 'PW01', user: 'Admin Aceh', action: 'upload', file: 'Kertas_Kerja_2026_Aceh.xlsx', time: '5 menit yang lalu' },
        { id: '2', pwId: 'PW12', user: 'Sistem Webhook', action: 'rename', file: 'Draft_DIY_Final.pdf', time: '1 jam yang lalu' },
        { id: '3', pwId: 'PW30', user: 'Staf Banten', action: 'delete', file: 'Copy_of_Laporan.docx', time: '2 jam yang lalu' },
        { id: '4', pwId: 'PW09', user: 'Admin DKI', action: 'upload', file: 'Laporan_Final_DKI.pdf', time: 'Kemarin, 14:30' },
        { id: '5', pwId: 'PW05', user: 'Sistem Webhook', action: 'create_folder', file: 'Bukti_Dukung_Q1', time: 'Kemarin, 09:00' },
        { id: '6', pwId: 'PW22', user: 'Admin Bali', action: 'upload', file: 'Data_Pendukung_Bali.zip', time: '20 Feb 2026, 10:15' },
    ];
}

export { PERWAKILAN_DATA };
