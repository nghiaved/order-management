import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, useAuthorization } from '../contexts/AuthContext';
import Modal from './Modal';

const ROLE_BADGE = {
    purple: 'border-purple-400 text-purple-400',
    blue: 'border-blue-400 text-blue-400',
    gray: 'border-gray-400 text-gray-400',
};

const navLinks = [
    {
        to: '/', label: 'Dashboard', permission: 'dashboard:read',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
        ),
    },
    {
        to: '/orders', label: 'Orders', permission: 'orders:list',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
        ),
    },
    {
        to: '/products', label: 'Products', permission: 'products:list',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
        ),
    },
    {
        to: '/inventory', label: 'Inventory', permission: 'inventory:list',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
        ),
    },
    {
        to: '/customers', label: 'Customers', permission: 'customers:list',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
        ),
    },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const { roleDisplayName, roleColor, hasPermission } = useAuthorization();
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);

    const handleLogout = () => {
        setProfileOpen(false);
        logout();
        navigate('/login');
    };

    const visibleNavItems = navLinks.filter(
        (link) => !link.permission || hasPermission(link.permission)
    );

    return (
        <div className="min-h-screen bg-[#0a0e1a] flex">
            <aside className="w-64 bg-[#111827] border-r border-gray-700/50 flex flex-col">
                <Link to="/" className='hover:opacity-80 transition-opacity'>
                    <div className="p-5 border-b border-gray-700/50 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white leading-tight">OMS</h1>
                            <p className="text-xs text-gray-500">Order Management</p>
                        </div>
                    </div>
                </Link>

                <nav className="flex-1 p-3 space-y-1 mt-1">
                    {visibleNavItems.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.to === '/'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                                }`
                            }
                        >
                            {link.icon}
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-700/50">
                    <p className="text-xs text-gray-600">Version 1.0.0</p>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-14 bg-[#111827] border-b border-gray-700/50 flex items-center justify-end px-6">
                    <button
                        onClick={() => setProfileOpen(true)}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-white leading-tight">{user?.name}</p>
                            <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border ${ROLE_BADGE[roleColor] || ROLE_BADGE.gray}`}>
                                {roleDisplayName}
                            </span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                            {user?.name?.[0]?.toUpperCase()}
                        </div>
                    </button>
                </header>

                <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="Profile" size="sm">
                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                                {user?.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-white">{user?.name}</p>
                                <p className="text-sm text-gray-400">@{user?.username}</p>
                            </div>
                        </div>
                        {user?.note && <p className="text-sm text-gray-400 bg-[#0a0e1a] rounded-xl px-4 py-3">{user.note}</p>}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Role</span>
                            <span className={`inline-block text-xs px-2.5 py-1 rounded-full border ${ROLE_BADGE[roleColor] || ROLE_BADGE.gray}`}>
                                {roleDisplayName}
                            </span>
                        </div>
                        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 font-medium transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </Modal>

                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
