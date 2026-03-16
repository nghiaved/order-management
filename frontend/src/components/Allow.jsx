import { useAuthorization } from '../contexts/AuthContext';

/**
 * Conditionally render children based on RBAC permission.
 *
 * Usage:
 *   <Allow permission="orders:delete">
 *     <button>Delete</button>
 *   </Allow>
 *
 * Or with a fallback:
 *   <Allow permission="orders:create" fallback={<span>No access</span>}>
 *     <button>Create</button>
 *   </Allow>
 */
export default function Allow({ permission, fallback = null, children }) {
    const { hasPermission } = useAuthorization();

    if (!hasPermission(permission)) return fallback;
    return children;
}
