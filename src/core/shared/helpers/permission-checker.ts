/**
 * Funciones de utilidad para verificar permisos en el cliente y servidor
 *
 * Este módulo re-exporta las funciones del PermissionService centralizado
 * para mantener compatibilidad con el código existente.
 *
 * Para nuevo código, se recomienda usar directamente:
 * - PermissionService desde @/core/lib/permissions/permission.service
 * - PermissionGuard componente para UI condicional
 * - PermissionActions para type-safety
 */

import { PermissionService } from "@/core/lib/permissions/permission.service";
import { SUPER_ADMIN_PERMISSION_NAME } from "../constants/permissions";

// Re-exportar funciones principales desde el servicio centralizado
export const hasPermission =
  PermissionService.hasPermission.bind(PermissionService);
export const hasAnyPermission =
  PermissionService.hasAnyPermission.bind(PermissionService);
export const hasAllPermissions =
  PermissionService.hasAllPermissions.bind(PermissionService);
export const isSuperAdmin =
  PermissionService.isSuperAdmin.bind(PermissionService);
export const hasResourceAccess =
  PermissionService.hasResourceAccess.bind(PermissionService);
export const parsePermission =
  PermissionService.parsePermission.bind(PermissionService);
export const getAccessibleResources =
  PermissionService.getAccessibleResources.bind(PermissionService);
export const getPermissionsForResource =
  PermissionService.getPermissionsForResource.bind(PermissionService);

/**
 * Verifica si un permiso es de tipo modular (gestionar)
 * @param permission - Nombre del permiso
 * @returns true si es un permiso modular
 */
export function isModularPermission(permission: string): boolean {
  return (
    permission.endsWith(":gestionar") ||
    permission === SUPER_ADMIN_PERMISSION_NAME
  );
}
