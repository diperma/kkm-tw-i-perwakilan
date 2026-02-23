import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FolderOpen, LogIn, Loader2, AlertTriangle, Shield, UserCircle } from 'lucide-react';

export default function LoginPage() {
    const { user, loginWithGoogle, loginAsGuest } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    if (user) {
        return <Navigate to="/" replace />;
    }

    const handleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await loginWithGoogle();
        } catch (err) {
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Login dibatalkan. Silakan coba lagi.');
            } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/invalid-api-key') {
                setError('Firebase belum dikonfigurasi. Silakan update file src/firebase.js dengan config project Anda.');
            } else {
                setError('Gagal login: ' + (err.message || 'Terjadi kesalahan'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">

            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl"></div>

                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '50px 50px'
                    }}
                ></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-fade-in">

                {/* Logo & Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-2xl shadow-blue-500/30 mb-6 relative">
                        <FolderOpen className="text-white h-10 w-10" />
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white shadow-lg"></div>
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                        Moni<span className="text-blue-400">Drive</span>
                    </h1>
                    <p className="text-blue-200/60 font-medium text-sm">
                        Dashboard Monitoring Kertas Kerja Perwakilan
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-white mb-1">Selamat Datang</h2>
                        <p className="text-blue-200/50 text-sm">
                            Login untuk mengakses dashboard monitoring
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3">
                            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Google Sign In Button */}
                    <button
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        ) : (
                            <>
                                {/* Google Icon */}
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span>Login dengan Google</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={loginAsGuest}
                        disabled={isLoading}
                        className="w-full mt-4 flex items-center justify-center space-x-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <UserCircle className="w-5 h-5 text-blue-300" />
                        <span>Masuk sebagai Guest (Demo Mode)</span>
                    </button>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-transparent px-4 text-xs text-blue-200/30 font-medium">AKSES TERBATAS</span>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex items-start space-x-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                        <Shield className="w-4 h-4 text-blue-400/60 shrink-0 mt-0.5" />
                        <p className="text-blue-200/40 text-xs leading-relaxed">
                            Hanya akun Google yang terdaftar di organisasi yang dapat mengakses dashboard ini. Hubungi administrator jika mengalami kendala.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-blue-200/20 text-xs mt-8 font-medium">
                    © 2026 MoniDrive — Sistem Monitoring Kertas Kerja Perwakilan
                </p>
            </div>
        </div>
    );
}
