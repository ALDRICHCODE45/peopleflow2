/**
 * Configuración de permisos requeridos por ruta
 *
 * Define qué permiso se necesita para acceder a cada ruta del sistema.
 * Las rutas que no estén listadas aquí serán accesibles sin permisos específicos.
 *
 * Formato: "ruta" -> "permiso:accion"
 */

import { Routes } from "@core/shared/constants/routes";

/**
 * Mapa de rutas a permisos requeridos
 */
export const ROUTE_PERMISSIONS: Record<string, string> = {
  // ═══════════════════════════════════════════════════════════════
  // MÓDULO: ADMINISTRACIÓN
  // ═══════════════════════════════════════════════════════════════

  // Usuarios
  [Routes.admin.usuarios]: "usuarios:acceder",
  [`${Routes.admin.usuarios}/crear`]: "usuarios:crear",
  [`${Routes.admin.usuarios}/editar`]: "usuarios:editar",

  // Roles y Permisos
  [Routes.admin.rolesPermisos]: "roles:acceder",
  [`${Routes.admin.rolesPermisos}/crear`]: "roles:crear",
  [`${Routes.admin.rolesPermisos}/editar`]: "roles:editar",

  // ═══════════════════════════════════════════════════════════════
  // MÓDULO: FINANZAS
  // ═══════════════════════════════════════════════════════════════

  // Ingresos
  "/finanzas/ingresos": "ingresos:acceder",
  "/finanzas/ingresos/crear": "ingresos:crear",
  "/finanzas/ingresos/editar": "ingresos:editar",

  // Egresos
  "/finanzas/egresos": "egresos:acceder",
  "/finanzas/egresos/crear": "egresos:crear",
  "/finanzas/egresos/editar": "egresos:editar",

  // Clientes
  "/finanzas/clientes": "clientes:acceder",

  // Facturas
  "/finanzas/facturas": "facturas:acceder",

  // ═══════════════════════════════════════════════════════════════
  // MÓDULO: RECLUTAMIENTO
  // ═══════════════════════════════════════════════════════════════

  // Vacantes
  [Routes.reclutamiento.vacantes]: "vacantes:acceder",
  [`${Routes.reclutamiento.vacantes}/crear`]: "vacantes:crear",
  [`${Routes.reclutamiento.vacantes}/editar`]: "vacantes:editar",

  // Kanban (Candidatos)
  "/reclutamiento/kanban": "candidatos:acceder",

  // Reportes
  "/reclutamiento/reportes": "reportes-reclutamiento:acceder",

  // ═══════════════════════════════════════════════════════════════
  // MÓDULO: VENTAS
  // ═══════════════════════════════════════════════════════════════

  // Leads
  [Routes.leads.list]: "leads:acceder",
  [`${Routes.leads.list}/crear`]: "leads:crear",
  [`${Routes.leads.list}/editar`]: "leads:editar",

  // Kanban (Leads)
  [Routes.leads.kanban]: "leads:acceder",

  // Reportes
  "/generacion-de-leads/reportes": "reportes-ventas:acceder",

  // ═══════════════════════════════════════════════════════════════
  // MÓDULO: SISTEMA
  // ═══════════════════════════════════════════════════════════════

  // Configuración
  "/system/config": "configuracion:acceder",

  // Actividad
  "/system/activity": "actividad:acceder",

  // ═══════════════════════════════════════════════════════════════
  // RUTAS ESPECIALES
  // ═══════════════════════════════════════════════════════════════

  // Super Admin Dashboard
  [Routes.superAdmin]: "super:admin",
} as const;

/**
 * Rutas públicas que no requieren autenticación
 */
export const PUBLIC_ROUTES: string[] = [
  Routes.signIn,
  "/api/auth",
  Routes.accessDenied,
];

/**
 * Rutas que requieren autenticación pero no permisos específicos
 */
export const AUTHENTICATED_ROUTES: string[] = [Routes.selectTenant];

/**
 * Obtiene el permiso requerido para una ruta específica
 *
 * @param path - Ruta a verificar (ej: "/facturas/crear")
 * @returns El permiso requerido o undefined si no requiere permisos específicos
 */
export function getRequiredPermission(path: string): string | undefined {
  // Buscar coincidencia exacta primero
  if (path in ROUTE_PERMISSIONS) {
    return ROUTE_PERMISSIONS[path];
  }

  // Buscar coincidencia por prefijo (para rutas dinámicas como /facturas/[id])
  const pathParts = path.split("/").filter(Boolean);

  for (let i = pathParts.length; i > 0; i--) {
    const partialPath = "/" + pathParts.slice(0, i).join("/");
    if (partialPath in ROUTE_PERMISSIONS) {
      return ROUTE_PERMISSIONS[partialPath];
    }
  }

  return undefined;
}

/**
 * Verifica si una ruta requiere permisos específicos
 *
 * @param path - Ruta a verificar
 * @returns true si la ruta requiere permisos
 */
export function requiresPermission(path: string): boolean {
  return getRequiredPermission(path) !== undefined;
}

/**
 * Verifica si una ruta es pública
 *
 * @param path - Ruta a verificar
 * @returns true si la ruta es pública
 */
export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(
    (publicPath) => path === publicPath || path.startsWith(publicPath + "/")
  );
}

/**
 * Verifica si una ruta requiere solo autenticación (sin permisos específicos)
 *
 * @param path - Ruta a verificar
 * @returns true si la ruta requiere solo autenticación
 */
export function isAuthenticatedRoute(path: string): boolean {
  return AUTHENTICATED_ROUTES.some(
    (authPath) => path === authPath || path.startsWith(authPath + "/")
  );
}

/**
 * Verifica si una ruta requiere el permiso de super:admin
 *
 * @param path - Ruta a verificar
 * @returns true si requiere super:admin
 */
export function requiresSuperAdmin(path: string): boolean {
  const permission = getRequiredPermission(path);
  return permission === "super:admin";
}

/**
 * Obtiene todas las rutas configuradas para un recurso específico
 *
 * @param resource - Recurso a buscar (ej: "usuarios", "ingresos")
 * @returns Array de rutas que requieren permisos de ese recurso
 */
export function getRoutesForResource(resource: string): string[] {
  return Object.entries(ROUTE_PERMISSIONS)
    .filter(([, permission]) => permission.startsWith(`${resource}:`))
    .map(([route]) => route);
}

/**
 * Prioridad de rutas para redirección por defecto
 * Las rutas se evaluarán en este orden para determinar la ruta por defecto
 */
export const ROUTE_PRIORITY: string[] = [
  // Administración (prioridad alta)
  Routes.admin.usuarios,
  Routes.admin.rolesPermisos,
  // Finanzas
  "/finanzas/ingresos",
  "/finanzas/egresos",
  "/finanzas/clientes",
  "/finanzas/facturas",
  // Reclutamiento
  Routes.reclutamiento.vacantes,
  "/reclutamiento/kanban",
  "/reclutamiento/reportes",
  // Ventas
  Routes.leads.list,
  Routes.leads.kanban,
  "/generacion-de-leads/reportes",
  // Sistema
  "/system/config",
  "/system/activity",
];
