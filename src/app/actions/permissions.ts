'use server';

import { auth } from '@lib/auth';
import { getUserRoleInTenant } from '@lib/tenants';
import { hasPermission, getRolePermissions } from '@lib/permissions';
import { headers } from 'next/headers';

/**
 * Server Actions para verificar permisos
 */

/**
 * Verifica si el usuario actual tiene un permiso específico
 */
export async function checkPermissionAction(
  permission: string,
  tenantId: string | null
): Promise<boolean> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session?.user) {
      return false;
    }

    // Obtener el rol del usuario en el tenant (o global si es superadmin)
    const role = await getUserRoleInTenant(session.user.id, tenantId);

    if (!role) {
      return false;
    }

    // Verificar si el rol tiene el permiso
    return hasPermission(role.name, permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Obtiene todos los permisos del usuario actual en un tenant
 */
export async function getUserPermissionsAction(tenantId: string | null) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session?.user) {
      return { error: 'No autenticado', permissions: [] };
    }

    // Obtener el rol del usuario en el tenant
    const role = await getUserRoleInTenant(session.user.id, tenantId);

    if (!role) {
      return { error: 'No tienes un rol asignado', permissions: [] };
    }

    // Obtener permisos del rol
    const permissions = getRolePermissions(role.name);

    return { error: null, permissions: [...permissions] };
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return { error: 'Error al obtener permisos', permissions: [] };
  }
}
