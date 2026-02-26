import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // Langsung baca dari localStorage saat init agar tidak ada flash 'token null' saat halaman di-refresh
    const [driveToken, setDriveToken] = useState(() => localStorage.getItem('driveToken'));

    useEffect(() => {
        let unsubscribe;
        try {
            unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
                setUser(firebaseUser);
                setLoading(false);
            }, (error) => {
                console.error("Auth state error:", error);
                setLoading(false);
            });
        } catch (error) {
            console.error("Firebase auth initialization error:", error);
            setLoading(false);
        }

        const timeout = setTimeout(() => {
            if (loading) {
                console.warn('Firebase auth timeout');
                setLoading(false);
            }
        }, 3000);

        return () => {
            if (unsubscribe) unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        // Request Google Drive readonly scope & Activity log scope
        provider.addScope('https://www.googleapis.com/auth/drive.readonly');
        provider.addScope('https://www.googleapis.com/auth/drive.activity.readonly');
        // Scope to fetch user profile names from People API (directory lookup for Workspace users)
        provider.addScope('https://www.googleapis.com/auth/directory.readonly');

        try {
            const result = await signInWithPopup(auth, provider);

            // Extract Google API Access Token
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
                setDriveToken(credential.accessToken);
                // Ganti ke localStorage agar sesi token bisa persisten meski tab ditutup 
                // (Catatan: OAuth token Google memiliki natural expiry 1 jam, tapi tidak akan hilang jika page di-refresh)
                localStorage.setItem('driveToken', credential.accessToken);
            }

            return result.user;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const loginAsGuest = () => {
        setUser({
            uid: 'guest-123',
            displayName: 'Guest Worker',
            email: 'demo@monidrive.local',
            photoURL: null
        });
    };

    const logout = async () => {
        try {
            if (user?.uid === 'guest-123') {
                setUser(null);
                setDriveToken(null);
                return;
            }
            await signOut(auth);
            setDriveToken(null);
            localStorage.removeItem('driveToken');
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    };

    const value = {
        user,
        loading,
        driveToken: driveToken || localStorage.getItem('driveToken'),
        loginWithGoogle,
        loginAsGuest,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
