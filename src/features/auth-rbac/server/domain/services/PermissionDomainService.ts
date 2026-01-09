import { PermissionService } from "@/core/lib/permissions/permission.service";
import { SUPER_ADMIN_PERMISSION_NAME } from "@/core/shared/constants/permissions";

/**
 * Servicio de dominio para Permisos
 *
 * NOTA: Este servicio ahora delega la lógica de verificación al PermissionService centralizado.
 * Se mantiene para compatibilidad con el código existente que usa este servicio.
 *
 * Para nuevo código, usar directamente PermissionService de @/core/lib/permissions/permission.service
 */

export class PermissionDomainService {
  /**
   * Verifica si un array de permisos incluye el permiso especificado
   * @param userPermissions - Array de permisos del usuario
   * @param permission - Permiso a verificar
   * @returns true si tiene el permiso
   */
  hasPermission(userPermissions: string[], permission: string): boolean {
    return PermissionService.hasPermission(userPermissions, permission);
  }

  /**
   * Verifica si un rol es superadmin basado en el nombre del rol
   * @param roleName - Nombre del rol
   * @returns true si el rol es "administrador" (tiene super:admin)
   */
  isSuperAdminRole(roleName: string): boolean {
    // El rol "administrador" tiene asignado el permiso super:admin
    return roleName === "administrador";
  }

  /**
   * Verifica si los permisos incluyen super:admin
   * @param userPermissions - Array de permisos del usuario
   * @returns true si tiene super:admin
   */
  isSuperAdmin(userPermissions: string[]): boolean {
    return PermissionService.isSuperAdmin(userPermissions);
  }

  /**
   * Parsea un permiso en recurso y acción
   * @param permission - Permiso en formato "recurso:acción"
   * @returns Objeto con recurso y acción, o null si el formato es inválido
   */
  parsePermission(permission: string): { resource: string; action: string } | null {
    return PermissionService.parsePermission(permission);
  }

  /**
   * Verifica si el usuario tiene acceso a un recurso específico
   * @param userPermissions - Array de permisos del usuario
   * @param resource - Nombre del recurso
   * @returns true si tiene algún permiso sobre el recurso
   */
  hasResourceAccess(userPermissions: string[], resource: string): boolean {
    return PermissionService.hasResourceAccess(userPermissions, resource);
  }
}
