/**
 * Mapa de permisos por rol
 *
 * Este archivo contiene los permisos mapeados en duro para cada rol.
 * Los permisos se verifican contra este mapa en tiempo de ejecución.
 */

// Mapa de permisos por rol
export const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  capturador: ["facturas:acceder", "facturas:crear"],
  gerente: [
    "colaboradores:acceder",
    "colaboradores:crear",
    "colaboradores:editar",
  ],
  superadmin: ["*"], // Acceso total - puede hacer todo
} as const;

// Tipo para los nombres de roles
export type RoleName = keyof typeof ROLE_PERMISSIONS;

// Tipo para los permisos
export type Permission =
  | "facturas:acceder"
  | "facturas:crear"
  | "colaboradores:acceder"
  | "colaboradores:crear"
  | "colaboradores:editar"
  | "*"
  | string; // Permitir cualquier string para flexibilidad

/**
 * Verifica si un rol tiene un permiso específico
 * @param role - Nombre del rol
 * @param permission - Permiso a verificar
 * @returns true si el rol tiene el permiso, false en caso contrario
 */
export function hasPermission(role: string, permission: string): boolean {
  // Superadmin tiene acceso total
  if (role === "superadmin") {
    return true;
  }

  const rolePermissions = ROLE_PERMISSIONS[role];

  if (!rolePermissions) {
    return false;
  }

  return rolePermissions.includes(permission);
}

/**
 * Obtiene todos los permisos de un rol
 * @param role - Nombre del rol
 * @returns Array de permisos del rol, o array vacío si el rol no existe
 */
export function getRolePermissions(role: string): readonly string[] {
  const rolePermissions = ROLE_PERMISSIONS[role];
  return rolePermissions || [];
}

/**
 * Verifica si un rol es superadmin
 * @param role - Nombre del rol
 * @returns true si el rol es superadmin, false en caso contrario
 */
export function isSuperAdmin(role: string): boolean {
  return role === "superadmin";
}
