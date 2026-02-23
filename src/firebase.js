import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ============================================================
// PENTING: Ganti konfigurasi di bawah ini dengan konfigurasi
// Firebase project Anda sendiri.
//
// Cara mendapatkan config:
// 1. Buka https://console.firebase.google.com/
// 2. Buat project baru atau pilih project yang ada
// 3. Klik ikon gear (Settings) → Project settings
// 4. Scroll ke "Your apps" → Tambahkan Web App
// 5. Copy config object
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyBF1iJ15XN2tg5QwxdI9dN1n_UQJP2TZ0M",
    authDomain: "kkm-tw-i-perwakilan.firebaseapp.com",
    projectId: "kkm-tw-i-perwakilan",
    storageBucket: "kkm-tw-i-perwakilan.firebasestorage.app",
    messagingSenderId: "984619505712",
    appId: "1:984619505712:web:92ef7ff331a206ec1af5f5",
    measurementId: "G-6Z47PLZSY6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
