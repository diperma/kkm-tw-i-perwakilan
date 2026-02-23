import { useState, useEffect } from 'react';
import { fetchDriveActivity } from '../services/driveService';
import { getFallbackActivityLogs } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';

export function useActivityLogs() {
    const { driveToken, user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usingFallback, setUsingFallback] = useState(false);

    useEffect(() => {
        const loadLogs = async () => {
            setLoading(true);

            if (!driveToken) {
                setLogs([]);
                setUsingFallback(false);
                setLoading(false);
                return;
            }

            try {
                const activities = await fetchDriveActivity(driveToken);

                const formattedLogs = activities.map(act => {
                    const actionDetail = act.primaryActionDetail;
                    let action = 'unknown';
                    if (actionDetail.create) action = 'upload';
                    if (actionDetail.edit) action = 'edit';
                    if (actionDetail.rename) action = 'rename';
                    if (actionDetail.delete) action = 'delete';

                    const targetItem = act.targets?.[0]?.driveItem;
                    if (actionDetail.create && targetItem?.folder) {
                        action = 'create_folder';
                    }

                    const fileName = targetItem?.title || 'Folder Perwakilan';

                    // Coba mencari ID PW, misal 'PW01' di nama file
                    const pwMatch = fileName.match(/PW\d{2}/i);
                    const pwId = pwMatch ? pwMatch[0].toUpperCase() : 'Drive';

                    return {
                        id: act.timestamp || Math.random().toString(),
                        pwId,
                        user: 'Kontributor',
                        action,
                        file: fileName,
                        time: act.timestamp ? formatRelativeTime(new Date(act.timestamp)) : 'Baru saja'
                    };
                });

                if (formattedLogs.length > 0) {
                    setLogs(formattedLogs);
                    setUsingFallback(false);
                } else {
                    setLogs([]);
                    setUsingFallback(false);
                }
            } catch (err) {
                console.error('Failed fetching drive activity:', err);
                setLogs([]);
                setUsingFallback(false);
            } finally {
                setLoading(false);
            }
        };

        loadLogs();

        // Polling setiap 30 detik
        const interval = setInterval(loadLogs, 30000);
        return () => clearInterval(interval);

    }, [driveToken, user]);

    return { logs, loading, usingFallback };
}

function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit yang lalu`;
    if (hours < 24) return `${hours} jam yang lalu`;
    if (days < 7) return `${days} hari yang lalu`;

    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}
