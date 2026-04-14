/**
 * RBAC Helper - Role-Based Access Control utilities for frontend
 * Provides permission constants and a hasPermission checker for client-side use.
 */

// ── Permission constants (resource:action format) ──────────────────
export const PERMISSIONS = {
    ORDERS_CREATE: 'orders:create',
    ORDERS_READ: 'orders:read',
    ORDERS_UPDATE: 'orders:update',
    ORDERS_DELETE: 'orders:delete',
    ORDERS_LIST: 'orders:list',

    PRODUCTS_CREATE: 'products:create',
    PRODUCTS_READ: 'products:read',
    PRODUCTS_UPDATE: 'products:update',
    PRODUCTS_DELETE: 'products:delete',
    PRODUCTS_LIST: 'products:list',

    INVENTORY_CREATE: 'inventory:create',
    INVENTORY_READ: 'inventory:read',
    INVENTORY_UPDATE: 'inventory:update',
    INVENTORY_DELETE: 'inventory:delete',
    INVENTORY_LIST: 'inventory:list',

    CUSTOMERS_CREATE: 'customers:create',
    CUSTOMERS_READ: 'customers:read',
    CUSTOMERS_UPDATE: 'customers:update',
    CUSTOMERS_DELETE: 'customers:delete',
    CUSTOMERS_LIST: 'customers:list',

    USERS_CREATE: 'users:create',
    USERS_READ: 'users:read',
    USERS_UPDATE: 'users:update',
    USERS_DELETE: 'users:delete',
    USERS_LIST: 'users:list',

    DASHBOARD_READ: 'dashboard:read',

    PAYMENTS_CREATE: 'payments:create',
    PAYMENTS_READ: 'payments:read',
};

// ── Role hierarchy (mirrors the SQL hierarchy_level) ───────────────
export const ROLE_HIERARCHY = {
    admin: 75,
    staff: 50,
};

// ── Helper functions ───────────────────────────────────────────────

/**
 * Check whether a user object owns a given "resource:action" permission.
 */
export function hasPermission(user, permission) {
    if (!user || !Array.isArray(user.permissions)) return false;
    return user.permissions.includes(permission);
}

/**
 * Shorthand: build a permission string and check it.
 */
export function canAccess(user, resource, action) {
    return hasPermission(user, `${resource}:${action}`);
}

/**
 * Check whether the user's hierarchy level meets a minimum threshold.
 */
export function hasMinimumLevel(user, minimumLevel) {
    return (user?.hierarchyLevel ?? 0) >= minimumLevel;
}

/**
 * Convenience: is admin (hierarchyLevel >= 75)?
 */
export function isAdmin(user) {
    return hasMinimumLevel(user, ROLE_HIERARCHY.admin);
}
