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
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

// ================================
// Data Perwakilan (36 kantor)
// ================================
const PERWAKILAN_DATA = [
  { id: "PW01", name: "Aceh", reviewer: "Yanti dan Prido" },
  { id: "PW02", name: "Sumatera Utara", reviewer: "Whibei dan Fauzan" },
  { id: "PW03", name: "Sumatera Barat", reviewer: "Wisye dan Tania" },
  { id: "PW04", name: "Riau", reviewer: "Dea dan Rehan" },
  { id: "PW05", name: "Jambi", reviewer: "Yanti dan Prido" },
  { id: "PW06", name: "Bengkulu", reviewer: "Whibei dan Fauzan" },
  { id: "PW07", name: "Sumatera Selatan", reviewer: "Yanti dan Prido" },
  { id: "PW08", name: "Lampung", reviewer: "Wisye dan Tania" },
  { id: "PW09", name: "DKI Jakarta", reviewer: "Dea dan Rehan" },
  { id: "PW10", name: "Jawa Barat", reviewer: "Dea dan Rehan" },
  { id: "PW11", name: "Jawa Tengah", reviewer: "Whibei dan Fauzan" },
  { id: "PW12", name: "DI Yogyakarta", reviewer: "Yanti dan Prido" },
  { id: "PW13", name: "Jawa Timur", reviewer: "Wisye dan Tania" },
  { id: "PW14", name: "Kalimantan Barat", reviewer: "Whibei dan Fauzan" },
  { id: "PW15", name: "Kalimantan Tengah", reviewer: "Wisye dan Tania" },
  { id: "PW16", name: "Kalimantan Selatan", reviewer: "Dea dan Rehan" },
  { id: "PW17", name: "Kalimantan Timur", reviewer: "Yanti dan Prido" },
  { id: "PW18", name: "Sulawesi Utara", reviewer: "Whibei dan Fauzan" },
  { id: "PW19", name: "Sulawesi Tengah", reviewer: "Wisye dan Tania" },
  { id: "PW20", name: "Sulawesi Tenggara", reviewer: "Dea dan Rehan" },
  { id: "PW21", name: "Sulawesi Selatan", reviewer: "Yanti dan Prido" },
  { id: "PW22", name: "Bali", reviewer: "Whibei dan Fauzan" },
  { id: "PW23", name: "Nusa Tenggara Barat", reviewer: "Wisye dan Tania" },
  { id: "PW24", name: "Nusa Tenggara Timur", reviewer: "Dea dan Rehan" },
  { id: "PW25", name: "Maluku", reviewer: "Yanti dan Prido" },
  { id: "PW26", name: "Papua", reviewer: "Whibei dan Fauzan" },
  { id: "PW27", name: "Papua Barat", reviewer: "Wisye dan Tania" },
  { id: "PW28", name: "Kepulauan Riau", reviewer: "Dea dan Rehan" },
  {
    id: "PW29",
    name: "Kepulauan Bangka Belitung",
    reviewer: "Yanti dan Prido",
  },
  { id: "PW30", name: "Banten", reviewer: "Whibei dan Fauzan" },
  { id: "PW31", name: "Gorontalo", reviewer: "Wisye dan Tania" },
  { id: "PW32", name: "Sulawesi Barat", reviewer: "Dea dan Rehan" },
  { id: "PW33", name: "Maluku Utara", reviewer: "Yanti dan Prido" },
  { id: "PW34", name: "Kalimantan Utara", reviewer: "Whibei dan Fauzan" },
  { id: "PW35", name: "Papua Barat Daya", reviewer: "Wisye dan Tania" },
  { id: "PW36", name: "Papua Tengah", reviewer: "Dea dan Rehan" },
];

// ================================
// Seed / Initialize Data
// ================================
export async function seedPerwakilan() {
  const colRef = collection(db, "perwakilan");
  const snapshot = await getDocs(colRef);

  if (snapshot.size > 0) {
    console.log("Data sudah ada, skip seeding.");
    return false;
  }

  const promises = PERWAKILAN_DATA.map((item) =>
    setDoc(doc(db, "perwakilan", item.id), {
      id: item.id,
      name: item.name,
      reviewer: item.reviewer,
      status: "missing",
      lastUpdated: null,
      createdAt: serverTimestamp(),
    }),
  );

  await Promise.all(promises);
  console.log("Seeding selesai: 36 perwakilan ditambahkan.");
  return true;
}

// ================================
// Real-time Listeners
// ================================
export function subscribePerwakilan(callback) {
  const colRef = collection(db, "perwakilan");
  return onSnapshot(
    colRef,
    (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      // Sort by ID
      data.sort((a, b) => a.id.localeCompare(b.id));
      callback(data);
    },
    (error) => {
      console.error("Error listening to perwakilan:", error);
    },
  );
}

export function subscribeActivityLogs(callback, maxItems = 20) {
  const colRef = collection(db, "activityLogs");
  const q = query(colRef, orderBy("createdAt", "desc"), limit(maxItems));

  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      callback(logs);
    },
    (error) => {
      console.error("Error listening to activity logs:", error);
    },
  );
}

// ================================
// Mutations
// ================================
export async function updatePwakilanStatus(pwId, status) {
  const docRef = doc(db, "perwakilan", pwId);
  await updateDoc(docRef, {
    status,
    lastUpdated:
      status === "submitted" ? new Date().toISOString().split("T")[0] : null,
  });
}

export async function addActivityLog({ pwId, user, action, file }) {
  const colRef = collection(db, "activityLogs");
  await addDoc(colRef, {
    pwId,
    user,
    action,
    file,
    createdAt: serverTimestamp(),
  });
}

// ================================
// Fallback Data (offline / no Firebase)
// ================================
export function getFallbackPerwakilan() {
  return PERWAKILAN_DATA.map((item) => ({
    ...item,
    status: Math.random() > 0.4 ? "submitted" : "missing",
    lastUpdated:
      Math.random() > 0.4
        ? `2026-02-${Math.floor(Math.random() * 20 + 1)
            .toString()
            .padStart(2, "0")}`
        : null,
  }));
}

export function getFallbackActivityLogs() {
  return [
    {
      id: "1",
      pwId: "PW01",
      user: "Admin Aceh",
      action: "upload",
      file: "Kertas_Kerja_2026_Aceh.xlsx",
      time: "5 menit yang lalu",
    },
    {
      id: "2",
      pwId: "PW12",
      user: "Sistem Webhook",
      action: "rename",
      file: "Draft_DIY_Final.pdf",
      time: "1 jam yang lalu",
    },
    {
      id: "3",
      pwId: "PW30",
      user: "Staf Banten",
      action: "delete",
      file: "Copy_of_Laporan.docx",
      time: "2 jam yang lalu",
    },
    {
      id: "4",
      pwId: "PW09",
      user: "Admin DKI",
      action: "upload",
      file: "Laporan_Final_DKI.pdf",
      time: "Kemarin, 14:30",
    },
    {
      id: "5",
      pwId: "PW05",
      user: "Sistem Webhook",
      action: "create_folder",
      file: "Bukti_Dukung_Q1",
      time: "Kemarin, 09:00",
    },
    {
      id: "6",
      pwId: "PW22",
      user: "Admin Bali",
      action: "upload",
      file: "Data_Pendukung_Bali.zip",
      time: "20 Feb 2026, 10:15",
    },
  ];
}

export { PERWAKILAN_DATA };
