import { useMemo } from 'react';
import { useAuthorization } from '../contexts/AuthContext';

/**
 * Returns boolean permission flags for a given resource.
 *
 * Usage:
 *   const { canCreate, canEdit, canDelete, canView } = usePermissions('orders');
 */
export function usePermissions(resource) {
    const { hasPermission } = useAuthorization();

    return useMemo(
        () => ({
            canCreate: hasPermission(`${resource}:create`),
            canEdit: hasPermission(`${resource}:update`),
            canDelete: hasPermission(`${resource}:delete`),
            canView: hasPermission(`${resource}:read`) || hasPermission(`${resource}:list`),
        }),
        [resource, hasPermission]
    );
}
