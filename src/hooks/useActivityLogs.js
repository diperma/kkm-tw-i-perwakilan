import { useState, useEffect } from 'react';
import { fetchDriveActivity, fetchPersonName } from '../services/driveService';
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

                const formattedLogsPromises = activities.map(async act => {
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

                    let userName = 'Kontributor';
                    const actor = act.actors?.[0];

                    if (actor?.user?.knownUser?.isCurrentUser) {
                        userName = user?.displayName || 'Anda';
                    } else if (actor?.user?.knownUser?.personName) {
                        userName = await fetchPersonName(driveToken, actor.user.knownUser.personName);
                    } else if (actor?.user?.deletedUser) {
                        userName = 'Pengguna dihapus';
                    } else if (actor?.user?.unknownUser) {
                        userName = 'Pengguna tidak dikenal';
                    }

                    return {
                        id: act.timestamp || Math.random().toString(),
                        pwId,
                        user: userName,
                        action,
                        file: fileName,
                        time: act.timestamp ? formatRelativeTime(new Date(act.timestamp)) : 'Baru saja'
                    };
                });

                const formattedLogs = await Promise.all(formattedLogsPromises);

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
    }, [driveToken, user?.uid]);

    return { logs, loading, usingFallback };
}

function formatRelativeTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const month = months[date.getMonth()];

    return `${hours}.${minutes} ${day} ${month}`;
}
