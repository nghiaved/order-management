import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { hasPermission, canAccess, isAdmin, hasMinimumLevel } from '../utils/rbacHelper';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = authService.getCurrentUser();
        if (stored) setUser(stored);
        setLoading(false);
    }, []);

    const login = useCallback(async (username, password) => {
        const u = await authService.login(username, password);
        setUser(u);
        return u;
    }, []);

    const logout = useCallback(() => {
        authService.logout();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// ── Hooks ──────────────────────────────────────────────────────────

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

/**
 * Authorization hook — mirrors the Next.js useAuthorization() hook.
 */
export function useAuthorization() {
    const { user } = useAuth();

    const checkPermission = useCallback(
        (permission) => hasPermission(user, permission),
        [user]
    );

    const checkAccess = useCallback(
        (resource, action) => canAccess(user, resource, action),
        [user]
    );

    return {
        user,
        role: user?.role ?? null,
        hierarchyLevel: user?.hierarchyLevel ?? 0,
        roleDisplayName: user?.roleDisplayName ?? 'Guest',
        roleColor: user?.roleColor ?? 'gray',
        permissions: user?.permissions ?? [],
        hasPermission: checkPermission,
        canAccess: checkAccess,
        isAdmin: isAdmin(user),
        hasMinimumLevel: (lvl) => hasMinimumLevel(user, lvl),
    };
}
