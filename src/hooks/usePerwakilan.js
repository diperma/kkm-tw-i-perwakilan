import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchDriveContents,
  checkIfFolderHasFiles,
} from "../services/driveService";
import {
  PERWAKILAN_DATA,
  getFallbackPerwakilan,
} from "../services/firestoreService";

export function usePerwakilan() {
  const { driveToken, user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    // Jika token tidak ada, set error dan biarkan AuthContext / ProtectedRoute handle login redirect
    if (!driveToken) {
      setError(new Error("Sesi telah berakhir atau Anda belum login."));
      setUsingFallback(false);
      setLoading(false);
      return;
    }

    try {
      const files = await fetchDriveContents(driveToken);

      // Map file dari Drive ke daftar Perwakilan (36 item)
      // Asumsi: Nama folder/file di Drive mengandung nama Perwakilan.
      const mappedPromises = PERWAKILAN_DATA.map(async (pw) => {
        // Cari file/folder yang namanya mirip dengan nama perwakilan
        // Perbaikan: gunakan Regex strict bounds untuk membedakan Papua, Papua Barat, Papua Barat Daya dll
        const matchedFile = files.find((f) => {
          const folderName = f.name.toLowerCase();
          const pwName = pw.name.toLowerCase();

          // Jika ini Papua Barat, pastikan tidak mengandung "Daya"
          if (pwName === "papua barat" && folderName.includes("daya")) {
            return false;
          }
          // Jika ini sekadar Papua, pastikan tidak mengandung "Barat", "Tengah", "Selatan", "Pegunungan" dll
          if (
            pwName === "papua" &&
            (folderName.includes("barat") ||
              folderName.includes("tengah") ||
              folderName.includes("selatan") ||
              folderName.includes("pegunungan"))
          ) {
            return false;
          }

          return folderName.includes(pwName);
        });

        if (matchedFile) {
          // Validasi: Apakah folder ini memiliki file di dalamnya?
          const hasFiles = await checkIfFolderHasFiles(
            driveToken,
            matchedFile.id,
          );
          if (hasFiles) {
            return {
              ...pw,
              status: "submitted",
              reviewer: pw.reviewer,
              lastUpdated: new Date(
                matchedFile.modifiedTime,
              ).toLocaleDateString("id-ID"),
              driveFileId: matchedFile.id,
              driveFileName: matchedFile.name,
            };
          }
        }

        return {
          ...pw,
          status: "missing",
          reviewer: pw.reviewer,
          lastUpdated: null,
          driveFileId: matchedFile?.id || null, // Membantu fitur fallback tapi status tetep missing
          driveFileName: matchedFile?.name || null,
        };
      });

      const mappedData = await Promise.all(mappedPromises);

      setData(mappedData);
      setUsingFallback(false);
    } catch (err) {
      console.error("Gagal mengambil data dari Google Drive:", err);
      setError(err);
      setError(err);
      setUsingFallback(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [driveToken, user]);

  return { data, loading, error, usingFallback, refetch: fetchData };
}
