import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
    fetchDriveContents,
    fetchFilesInsideFolder,
} from "../services/driveService";
import { PERWAKILAN_DATA } from "../services/firestoreService";

export function usePerwakilan() {
    const { driveToken, user } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usingFallback, setUsingFallback] = useState(false);

    const fetchData = useCallback(async () => {
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
                    const innerFiles = await fetchFilesInsideFolder(
                        driveToken,
                        matchedFile.id,
                    );

                    if (innerFiles && innerFiles.length > 0) {
                        // Ekstrak nama Kab/Kota dari nama file
                        // Asumsi format: "Kertas Kerja - Kab. Bandung.xlsx" -> "Kab. Bandung"
                        const uploadedKabKota = innerFiles
                            .map((f) => {
                                let name = f.name;
                                // Bersihkan ekstensi rilis
                                name = name.replace(
                                    /\.(xlsx|xls|csv|pdf|doc|docx|zip|rar)$/i,
                                    "",
                                );
                                // Bersihkan teks umum jika ada
                                name = name.replace(/kertas\s*kerja\s*(-|_)?\s*/i, "");
                                name = name.replace(/tw\s*(i|1|satu)\s*(-|_)?\s*/i, "");

                                const cleanName = name.trim();
                                // Resolve ID: jika file adalah shortcut, gunakan targetId
                                const isShortcut = f.mimeType === "application/vnd.google-apps.shortcut";
                                const resolvedId = isShortcut && f.shortcutDetails?.targetId
                                    ? f.shortcutDetails.targetId
                                    : f.id;
                                const resolvedMimeType = isShortcut && f.shortcutDetails?.targetMimeType
                                    ? f.shortcutDetails.targetMimeType
                                    : f.mimeType;
                                return cleanName ? { id: resolvedId, name: cleanName, mimeType: resolvedMimeType } : null;
                            })
                            .filter(Boolean);

                        return {
                            ...pw,
                            status: "submitted",
                            reviewer: pw.reviewer,
                            lastUpdated: new Date(
                                matchedFile.modifiedTime,
                            ).toLocaleDateString("id-ID"),
                            driveFileId: matchedFile.id,
                            driveFileName: matchedFile.name,
                            uploadedKabKota: uploadedKabKota,
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
                    uploadedKabKota: [],
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
    }, [driveToken]);

    useEffect(() => {
        fetchData();
    }, [driveToken, user?.uid, fetchData]);

    return { data, loading, error, usingFallback, refetch: fetchData };
}
