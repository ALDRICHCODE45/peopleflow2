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

// Lista de todos los permisos disponibles
export const ALL_PERMISSIONS = [
  "facturas:acceder",
  "facturas:crear",
  "colaboradores:acceder",
  "colaboradores:crear",
  "colaboradores:editar",
] as const;

// Lista de todos los roles disponibles
export const ALL_ROLES = ["capturador", "gerente", "superadmin"] as const;
