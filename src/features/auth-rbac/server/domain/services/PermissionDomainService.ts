import { ROLE_PERMISSIONS } from "../constants/permissions";

/**
 * Servicio de dominio para Permisos
 * Contiene reglas de negocio puras relacionadas con permisos y roles
 */

export class PermissionDomainService {
  /**
   * Verifica si un rol tiene un permiso específico
   * @param roleName - Nombre del rol
   * @param permission - Permiso a verificar
   * @returns true si el rol tiene el permiso, false en caso contrario
   */
  hasPermission(roleName: string, permission: string): boolean {
    // Superadmin tiene acceso total
    if (roleName === "superadmin") {
      return true;
    }

    const rolePermissions = ROLE_PERMISSIONS[roleName];

    if (!rolePermissions) {
      return false;
    }

    return rolePermissions.includes(permission);
  }

  /**
   * Obtiene todos los permisos de un rol
   * @param roleName - Nombre del rol
   * @returns Array de permisos del rol, o array vacío si el rol no existe
   */
  getRolePermissions(roleName: string): readonly string[] {
    const rolePermissions = ROLE_PERMISSIONS[roleName];
    return rolePermissions || [];
  }

  /**
   * Verifica si un rol es superadmin
   * @param roleName - Nombre del rol
   * @returns true si el rol es superadmin, false en caso contrario
   */
  isSuperAdminRole(roleName: string): boolean {
    return roleName === "superadmin";
  }

  /**
   * Valida si un nombre de rol es válido
   */
  isValidRole(roleName: string): boolean {
    return roleName in ROLE_PERMISSIONS;
  }

  /**
   * Parsea un permiso en recurso y acción
   */
  parsePermission(permission: string): { resource: string; action: string } | null {
    const parts = permission.split(":");
    if (parts.length !== 2) {
      return null;
    }
    return { resource: parts[0], action: parts[1] };
  }
}
