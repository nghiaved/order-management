import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function LoginPage() {
    const { user, login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    if (user) return <Navigate to="/" replace />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#0a0e1a]">
            {/* ── Left Panel ─────────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 xl:px-24">
                <div className="w-14 h-14 rounded-2xl bg-[#1a2035] border border-gray-700/50 flex items-center justify-center mb-8">
                    <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold text-white mb-4">OMS Dashboard</h1>
                <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                    Quản lý đơn hàng, sản phẩm, tồn kho,<br />
                    và khách hàng tất cả trong một nơi.
                </p>
                <div className="space-y-4">
                    {['Giám sát thời gian thực', 'Phân tích nâng cao', 'Bảo mật và đáng tin cậy'].map((text) => (
                        <div key={text} className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-gray-300">{text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Right Panel ────────────────────────────────────── */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-6">
                <div className="w-full max-w-md">
                    <form onSubmit={handleSubmit} className="bg-[#111827] border border-gray-700/50 rounded-2xl p-8 space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Chào mừng trở lại</h2>
                            <p className="text-gray-400 text-sm mt-1">Nhập thông tin đăng nhập của bạn để truy cập tài khoản</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-1.5 rounded-lg">{error}</div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Tên đăng nhập</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Nhập tên đăng nhập của bạn"
                                    className="w-full bg-[#1a2035] border border-gray-700 rounded-lg pl-10 pr-3 py-1.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Mật khẩu</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Nhập mật khẩu của bạn"
                                    className="w-full bg-[#1a2035] border border-gray-700 rounded-lg pl-10 pr-10 py-1.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        {showPassword ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        ) : (
                                            <>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </>
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                        >
                            {loading ? 'Đang đăng nhập…' : (
                                <>Đăng nhập vào bảng điều khiển <span className="text-lg">→</span></>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-gray-600 text-xs mt-6">&copy; 2026. Bản quyền thuộc về hệ thống quản lý đơn hàng.</p>
                </div>
            </div>
        </div>
    );
}
