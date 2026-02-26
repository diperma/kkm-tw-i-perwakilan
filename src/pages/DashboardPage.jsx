import React, { useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePerwakilan } from "../hooks/usePerwakilan";
import { useActivityLogs } from "../hooks/useActivityLogs";
import { seedPerwakilan } from "../services/firestoreService";
import {
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    ExternalLink,
    FolderOpen,
    PieChart,
    Clock,
    LayoutGrid,
    Table2,
    BarChart3,
    Camera,
    Activity,
    FilePlus,
    FileEdit,
    Trash2,
    RefreshCw,
    LogOut,
    Database,
    Loader2,
    AlertCircle,
    Wifi,
    WifiOff,
    FileText,
} from "lucide-react";

/**
 * Mengembalikan URL Google yang sesuai berdasarkan mimeType file.
 * Spreadsheet → docs.google.com/spreadsheets/d/{id}/edit
 * Document   → docs.google.com/document/d/{id}/edit
 * Presentation → docs.google.com/presentation/d/{id}/edit
 * Lainnya    → drive.google.com/file/d/{id}/view
 */
function getGoogleFileUrl(fileId, mimeType) {
    // Google native types
    const sheetsTypes = [
        "application/vnd.google-apps.spreadsheet",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.ms-excel", // .xls
        "text/csv",
    ];
    const docsTypes = [
        "application/vnd.google-apps.document",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/msword", // .doc
    ];
    const slidesTypes = [
        "application/vnd.google-apps.presentation",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
        "application/vnd.ms-powerpoint", // .ppt
    ];

    if (sheetsTypes.includes(mimeType)) {
        return `https://docs.google.com/spreadsheets/d/${fileId}/edit`;
    }
    if (docsTypes.includes(mimeType)) {
        return `https://docs.google.com/document/d/${fileId}/edit`;
    }
    if (slidesTypes.includes(mimeType)) {
        return `https://docs.google.com/presentation/d/${fileId}/edit`;
    }
    if (mimeType === "application/vnd.google-apps.form") {
        return `https://docs.google.com/forms/d/${fileId}/edit`;
    }
    if (mimeType === "application/vnd.google-apps.drawing") {
        return `https://docs.google.com/drawings/d/${fileId}/edit`;
    }
    // PDF & lainnya → Drive file view
    return `https://drive.google.com/file/d/${fileId}/view`;
}

export default function DashboardPage() {
    const { user, logout, driveToken, loading: authLoading } = useAuth();
    const {
        data: perwakilanData,
        loading: dataLoading,
        error: dataError,
        usingFallback,
        refetch: refetchDriveData,
    } = usePerwakilan();
    const {
        logs: activityLogs,
        loading: logsLoading,
        usingFallback: logsFallback,
    } = useActivityLogs();

    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterReviewer, setFilterReviewer] = useState("all");
    const [viewMode, setViewMode] = useState("grid");
    const [activityLogPage, setActivityLogPage] = useState(1);
    const [seeding, setSeeding] = useState(false);
    const [seedMessage, setSeedMessage] = useState(null);

    const handleSeed = async () => {
        setSeeding(true);
        setSeedMessage(null);
        try {
            const created = await seedPerwakilan();
            setSeedMessage(
                created
                    ? "Data berhasil di-seed ke Firestore!"
                    : "Data sudah ada di Firestore.",
            );
        } catch (err) {
            setSeedMessage("Gagal seed: " + err.message);
        }
        setSeeding(false);
        setTimeout(() => setSeedMessage(null), 5000);
    };

    const handleRefreshData = async () => {
        setSeeding(true);
        setSeedMessage(null);
        try {
            if (refetchDriveData) {
                await refetchDriveData();
                setSeedMessage("Data berhasil di-refresh dari Google Drive.");
            }
        } catch (err) {
            setSeedMessage("Gagal refresh: " + err.message);
        }
        setSeeding(false);
        setTimeout(() => setSeedMessage(null), 5000);
    };

    // Filter & Search
    const filteredData = useMemo(() => {
        return perwakilanData.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus =
                filterStatus === "all" || item.status === filterStatus;
            const matchesReviewer =
                filterReviewer === "all" || item.reviewer === filterReviewer;

            return matchesSearch && matchesStatus && matchesReviewer;
        });
    }, [perwakilanData, searchTerm, filterStatus, filterReviewer]);

    // Statistics
    const stats = useMemo(() => {
        const total = perwakilanData.length;
        const submitted = perwakilanData.filter(
            (item) => item.status === "submitted",
        ).length;
        const missing = total - submitted;
        const percentage = total > 0 ? Math.round((submitted / total) * 100) : 0;
        return { total, submitted, missing, percentage };
    }, [perwakilanData]);

    // Region Groups
    const regionGroups = useMemo(() => {
        const groups = {
            Sumatera: { total: 0, submitted: 0, missing: 0 },
            Jawa: { total: 0, submitted: 0, missing: 0 },
            Kalimantan: { total: 0, submitted: 0, missing: 0 },
            Sulawesi: { total: 0, submitted: 0, missing: 0 },
            "Bali & Nusra": { total: 0, submitted: 0, missing: 0 },
            "Maluku & Papua": { total: 0, submitted: 0, missing: 0 },
        };

        perwakilanData.forEach((item) => {
            let region = "";
            const idNum = parseInt(item.id.replace("PW", ""));
            if ((idNum >= 1 && idNum <= 8) || idNum === 28 || idNum === 29)
                region = "Sumatera";
            else if ((idNum >= 9 && idNum <= 13) || idNum === 30) region = "Jawa";
            else if ((idNum >= 14 && idNum <= 17) || idNum === 34)
                region = "Kalimantan";
            else if ((idNum >= 18 && idNum <= 21) || idNum === 31 || idNum === 32)
                region = "Sulawesi";
            else if (idNum >= 22 && idNum <= 24) region = "Bali & Nusra";
            else region = "Maluku & Papua";

            groups[region].total++;
            if (item.status === "submitted") groups[region].submitted++;
            else groups[region].missing++;
        });

        return Object.keys(groups).map((key) => ({ name: key, ...groups[key] }));
    }, [perwakilanData]);

    const maxRegionTotal = Math.max(...regionGroups.map((g) => g.total), 1);

    // Tunggu auth selesai dulu (termasuk restore token dari localStorage)
    if (authLoading || dataLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">
                        Memuat data perwakilan...
                    </p>
                </div>
            </div>
        );
    }

    // Hanya tampilkan 'sesi berakhir' jika auth sudah selesai loading DAN token memang tidak ada
    if (!authLoading && !driveToken) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center animate-fade-in max-w-md mx-auto p-8">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
                        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-900 mb-2">
                            Sesi Google Drive Berakhir
                        </h2>
                        <p className="text-slate-600 text-sm mb-6">
                            Token akses Google Drive Anda sudah kedaluwarsa. Silakan login
                            ulang untuk mengakses data terbaru.
                        </p>
                        <button
                            onClick={async () => {
                                await logout();
                                window.location.href = "/kkm-tw-i-perwakilan/login";
                            }}
                            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Login Ulang dengan Google</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
                                <FolderOpen className="text-white h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight">
                                    Moni<span className="text-blue-600">Drive</span>
                                </h1>
                                <p className="text-xs text-slate-500 font-medium">
                                    Dashboard Kertas Kerja Perwakilan
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Connection status */}
                            <div
                                className={`hidden sm:flex items-center space-x-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${usingFallback
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-green-50 text-green-700 border border-green-200"
                                    }`}
                            >
                                {usingFallback ? (
                                    <WifiOff className="w-3 h-3" />
                                ) : (
                                    <Wifi className="w-3 h-3" />
                                )}
                                <span>{usingFallback ? "Mode Offline" : "Connected"}</span>
                            </div>

                            {/* Time */}
                            <div className="hidden md:flex items-center space-x-2 text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
                                <Clock className="w-4 h-4" />
                                <span>
                                    Update: {activityLogs?.[0]?.time || "Belum ada aktivitas"}
                                </span>
                            </div>

                            {/* User */}
                            <div className="flex items-center space-x-3">
                                {user?.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName}
                                        className="w-8 h-8 rounded-full border-2 border-blue-100 shadow-sm"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <span className="text-blue-600 font-bold text-sm">
                                            {user?.displayName?.[0] || user?.email?.[0] || "?"}
                                        </span>
                                    </div>
                                )}
                                <button
                                    onClick={logout}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title="Logout"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Fallback banner */}
                {usingFallback && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 animate-fade-in">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-amber-800 text-sm font-semibold">
                                Mode Data Demo (Drive API Gagal)
                            </p>
                            <p className="text-amber-700 text-xs mt-0.5">
                                {dataError
                                    ? dataError.message
                                    : "Silakan login dengan akun Google Workspace yang memiliki akses ke folder terkait."}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mb-4">
                    {seedMessage && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm font-medium animate-fade-in flex-1 mr-4">
                            {seedMessage}
                        </div>
                    )}
                    <div className="flex-1"></div>
                    <button
                        onClick={handleRefreshData}
                        disabled={seeding || !driveToken}
                        className="shrink-0 flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ml-auto"
                    >
                        <RefreshCw className={`w-4 h-4 ${seeding ? "animate-spin" : ""}`} />
                        <span>Refresh via Google Drive API</span>
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-8 animate-fade-in">
                    <div className="flex items-end justify-between mb-2">
                        <h2 className="text-lg font-bold text-slate-800">
                            Progress Nasional
                        </h2>
                        <span className="text-2xl font-black text-blue-600">
                            {stats.percentage}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-600 to-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${stats.percentage}%` }}
                        >
                            <div className="absolute inset-0 animate-shimmer rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4 animate-slide-up"
                        style={{ animationDelay: "0ms" }}
                    >
                        <div className="bg-blue-50 p-3 rounded-full">
                            <PieChart className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Total Perwakilan
                            </p>
                            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                        </div>
                    </div>

                    <div
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4 relative overflow-hidden animate-slide-up"
                        style={{ animationDelay: "100ms" }}
                    >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-full"></div>
                        <div className="bg-green-50 p-3 rounded-full relative z-10">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-slate-500">Telah Submit</p>
                            <p className="text-3xl font-bold text-green-600">
                                {stats.submitted}
                            </p>
                        </div>
                    </div>

                    <div
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4 relative overflow-hidden animate-slide-up"
                        style={{ animationDelay: "200ms" }}
                    >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full"></div>
                        <div className="bg-red-50 p-3 rounded-full relative z-10">
                            <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-slate-500">Belum Submit</p>
                            <p className="text-3xl font-bold text-red-500">{stats.missing}</p>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 gap-4">
                    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
                        <div className="relative w-full sm:w-80">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari PW atau Nama Daerah..."
                                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <Filter className="h-5 w-5 text-slate-400" />
                            <select
                                className="block w-full sm:w-40 pl-3 pr-8 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-slate-50 border transition-colors"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">Semua Status</option>
                                <option value="submitted">Telah Submit</option>
                                <option value="missing">Belum Submit</option>
                            </select>

                            <select
                                className="block w-full sm:w-auto min-w-[14rem] pl-3 pr-8 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-slate-50 border transition-colors"
                                value={filterReviewer}
                                onChange={(e) => setFilterReviewer(e.target.value)}
                            >
                                <option value="all">Semua QA Reviewer</option>
                                <option value="Dea dan Rehan">Dea dan Rehan</option>
                                <option value="Whibei dan Fauzan">Whibei dan Fauzan</option>
                                <option value="Wisye dan Tania">Wisye dan Tania</option>
                                <option value="Yanti dan Prido">Yanti dan Prido</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 w-full md:w-auto justify-center">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span>Grid</span>
                        </button>
                        <button
                            onClick={() => setViewMode("report")}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "report" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <Camera className="w-4 h-4" />
                            <span>Laporan</span>
                        </button>
                        <button
                            onClick={() => setViewMode("activity")}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "activity" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <Activity className="w-4 h-4" />
                            <span>Log</span>
                        </button>
                    </div>
                </div>

                {/* === VIEW: ACTIVITY LOG === */}
                {viewMode === "activity" ? (
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 animate-fade-in">
                        <div className="mb-6 border-b border-slate-200 pb-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                    <Activity className="w-6 h-6 text-blue-600" />
                                    Live Activity Log
                                </h2>
                                <span
                                    className={`flex items-center text-xs sm:text-sm px-3 py-1.5 rounded-full font-bold border ${logsFallback
                                        ? "text-amber-700 bg-amber-50 border-amber-200"
                                        : "text-green-700 bg-green-50 border-green-200"
                                        }`}
                                >
                                    <RefreshCw
                                        className={`w-4 h-4 mr-2 ${logsFallback ? "" : "animate-[spin_3s_linear_infinite]"}`}
                                    />
                                    {logsFallback ? "Demo Mode" : "Webhook Connected"}
                                </span>
                            </div>
                            <p className="text-slate-500 text-sm">
                                Memantau pergerakan dan aktivitas file pada Google Drive.
                            </p>
                        </div>

                        <div className="relative border-l-2 border-slate-200 ml-4 md:ml-6 space-y-8 pb-4">
                            {(() => {
                                const ITEMS_PER_PAGE = 10;
                                const totalPages = Math.ceil(activityLogs.length / ITEMS_PER_PAGE);
                                const currentLogs = activityLogs.slice(
                                    (activityLogPage - 1) * ITEMS_PER_PAGE,
                                    activityLogPage * ITEMS_PER_PAGE
                                );

                                return (
                                    <>
                                        {currentLogs.map((log) => {
                                            let Icon = FilePlus;
                                            let iconBg = "bg-blue-100";
                                            let iconColor = "text-blue-600";
                                            let actionText = "mengupload item";

                                            if (log.action === "rename") {
                                                Icon = FileEdit;
                                                iconBg = "bg-amber-100";
                                                iconColor = "text-amber-600";
                                                actionText = "mengganti nama item";
                                            } else if (log.action === "delete") {
                                                Icon = Trash2;
                                                iconBg = "bg-red-100";
                                                iconColor = "text-red-600";
                                                actionText = "menghapus item";
                                            } else if (log.action === "create_folder") {
                                                Icon = FolderOpen;
                                                iconBg = "bg-indigo-100";
                                                iconColor = "text-indigo-600";
                                                actionText = "membuat folder";
                                            } else if (log.action === "edit") {
                                                Icon = FileEdit;
                                                iconBg = "bg-emerald-100";
                                                iconColor = "text-emerald-600";
                                                actionText = "mengedit item";
                                            }

                                            return (
                                                <div key={log.id} className="relative pl-8 md:pl-10 mb-6">
                                                    <div
                                                        className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full ${iconBg} border-4 border-white flex items-center justify-center shadow-sm z-10`}
                                                    >
                                                        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                                                    </div>
                                                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative z-0">
                                                        <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2 sm:gap-0">
                                                            <p className="text-sm font-medium text-slate-800">
                                                                <span className="font-bold">{log.user}</span> {actionText}
                                                            </p>
                                                            <span className="text-sm font-bold text-slate-500 whitespace-nowrap">
                                                                {log.time}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-900 bg-white px-3 py-2 rounded border border-slate-200 mt-1 inline-block shadow-sm">
                                                            {log.file}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 -ml-4 md:-ml-6 pl-4 md:pl-6">
                                                <p className="text-sm text-slate-600">
                                                    Menampilkan halaman <span className="font-bold">{activityLogPage}</span> dari <span className="font-bold">{totalPages}</span>
                                                </p>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => setActivityLogPage((prev) => Math.max(prev - 1, 1))}
                                                        disabled={activityLogPage === 1}
                                                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
                                                    >
                                                        Sebelumnya
                                                    </button>
                                                    <button
                                                        onClick={() => setActivityLogPage((prev) => Math.min(prev + 1, totalPages))}
                                                        disabled={activityLogPage === totalPages}
                                                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
                                                    >
                                                        Selanjutnya
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                ) : /* === VIEW: REPORT === */
                    viewMode === "report" ? (
                        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 animate-fade-in">
                            <div className="mb-6 border-b border-slate-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">
                                        Laporan Monitoring Kertas Kerja
                                    </h2>
                                    <p className="text-slate-500 mt-1">
                                        Update terakhir:{" "}
                                        {activityLogs?.[0]?.time || "Belum ada aktivitas"}
                                    </p>
                                </div>
                                <div className="text-left md:text-right bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                                        Total Progress Nasional
                                    </p>
                                    <p className="text-3xl font-black text-blue-700 leading-none">
                                        {stats.percentage}%
                                    </p>
                                </div>
                            </div>

                            {/* Bar Chart */}
                            <div className="mb-10 rounded-xl border border-slate-200 p-4 md:p-6 bg-slate-50/50 overflow-x-auto">
                                <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center justify-center min-w-[500px]">
                                    <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
                                    Sebaran Progress per Wilayah
                                </h3>

                                <div className="flex items-end justify-between h-56 mt-4 space-x-2 sm:space-x-4 min-w-[500px]">
                                    {regionGroups.map((region) => (
                                        <div
                                            key={region.name}
                                            className="flex flex-col items-center flex-1 h-full justify-end group"
                                        >
                                            <div className="w-full flex justify-center space-x-1 sm:space-x-2 items-end h-40">
                                                <div
                                                    className="w-1/2 max-w-[40px] bg-green-500 rounded-t-md relative flex flex-col justify-end items-center transition-all duration-500"
                                                    style={{
                                                        height: `${(region.submitted / maxRegionTotal) * 100}%`,
                                                        minHeight: region.submitted > 0 ? "4px" : "0",
                                                    }}
                                                >
                                                    <span className="text-xs sm:text-sm font-bold text-green-700 -mt-6">
                                                        {region.submitted}
                                                    </span>
                                                </div>
                                                <div
                                                    className="w-1/2 max-w-[40px] bg-red-400 rounded-t-md relative flex flex-col justify-end items-center transition-all duration-500"
                                                    style={{
                                                        height: `${(region.missing / maxRegionTotal) * 100}%`,
                                                        minHeight: region.missing > 0 ? "4px" : "0",
                                                    }}
                                                >
                                                    <span className="text-xs sm:text-sm font-bold text-red-700 -mt-6">
                                                        {region.missing}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs sm:text-sm font-bold text-slate-700 mt-4 text-center leading-tight h-10 flex items-center">
                                                {region.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-center space-x-8 mt-4 pt-4 border-t border-slate-200 min-w-[500px]">
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-green-500 rounded mr-2 shadow-sm"></div>
                                        <span className="text-sm font-medium text-slate-700">
                                            Telah Submit
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-red-400 rounded mr-2 shadow-sm"></div>
                                        <span className="text-sm font-medium text-slate-700">
                                            Belum Submit
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                    <Table2 className="w-6 h-6 mr-2 text-blue-600" />
                                    Rincian Status ({filteredData.length} Perwakilan)
                                </h3>
                                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider"
                                                >
                                                    ID
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider"
                                                >
                                                    Nama Perwakilan
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider"
                                                >
                                                    PIC QA Reviewer
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider"
                                                >
                                                    Daftar Dokumen Kab/Kota
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider"
                                                >
                                                    Status
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider"
                                                >
                                                    Tgl Update
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {filteredData.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className="hover:bg-slate-50 transition-colors"
                                                >
                                                    <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-slate-900">
                                                        {item.id}
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-700">
                                                        {item.name}
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap text-xs font-semibold text-indigo-600 bg-indigo-50/50 rounded">
                                                        {item.reviewer}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm">
                                                        {item.uploadedKabKota &&
                                                            item.uploadedKabKota.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                                {item.uploadedKabKota.map((kabkota, idx) => (
                                                                    <a
                                                                        key={idx}
                                                                        href={getGoogleFileUrl(kabkota.id, kabkota.mimeType)}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        title={`Buka file ${kabkota.name}`}
                                                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 hover:text-blue-700 transition-colors"
                                                                        style={{
                                                                            whiteSpace: "normal",
                                                                            wordBreak: "break-word",
                                                                        }}
                                                                    >
                                                                        {kabkota.name}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs italic">
                                                                -
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap">
                                                        {item.status === "submitted" ? (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                                                <CheckCircle2 className="w-4 h-4 mr-1" /> Telah
                                                                Submit
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                                                <XCircle className="w-4 h-4 mr-1" /> Belum Submit
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500 font-medium">
                                                        {item.status === "submitted" ? item.lastUpdated : "-"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : /* === VIEW: GRID (default) === */
                        filteredData.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300 animate-fade-in">
                                <FolderOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                <h3 className="text-lg font-medium text-slate-900">
                                    Tidak ada data ditemukan
                                </h3>
                                <p className="text-slate-500">
                                    Coba ubah kata kunci pencarian atau filter status.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredData.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-full group animate-slide-up"
                                        style={{ animationDelay: `${idx * 30}ms` }}
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600">
                                                    {item.id}
                                                </span>
                                                {item.status === "submitted" ? (
                                                    <span className="inline-flex items-center space-x-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        <span>Submitted</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center space-x-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full animate-pulse">
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        <span>Pending</span>
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-base font-bold text-slate-900 mb-1 leading-tight group-hover:text-blue-600 transition-colors">
                                                {item.name}
                                            </h3>

                                            <p className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded inline-block mb-2 border border-slate-100">
                                                QA:{" "}
                                                <span className="text-slate-700 font-bold">
                                                    {item.reviewer}
                                                </span>
                                            </p>

                                            {item.status === "submitted" && (
                                                <p className="text-xs text-slate-500 mt-1 flex items-center">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    Tgl: {item.lastUpdated}
                                                </p>
                                            )}

                                            {item.status === "submitted" &&
                                                item.uploadedKabKota &&
                                                item.uploadedKabKota.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                                        <p className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center">
                                                            <FileText className="w-3 h-3 mr-1" />
                                                            Kab/Kota terunggah ({item.uploadedKabKota.length}):
                                                        </p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {item.uploadedKabKota.map((kabkota, idx) => (
                                                                <a
                                                                    key={idx}
                                                                    href={getGoogleFileUrl(kabkota.id, kabkota.mimeType)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    title={`Buka file ${kabkota.name}`}
                                                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors"
                                                                    style={{
                                                                        whiteSpace: "normal",
                                                                        wordBreak: "break-word",
                                                                    }}
                                                                >
                                                                    {kabkota.name}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                        </div>

                                        <div className="mt-5 pt-4 border-t border-slate-100">
                                            {item.status === "submitted" && item.driveFileId ? (
                                                <a
                                                    href={`https://drive.google.com/drive/folders/${item.driveFileId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                    title={`Buka folder ${item.driveFileName}`}
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    <span>Buka Folder Drive</span>
                                                </a>
                                            ) : (
                                                <button
                                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                                                    disabled
                                                >
                                                    <FolderOpen className="w-4 h-4" />
                                                    <span>File Belum Ada</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
            </main>
        </div>
    );
}
