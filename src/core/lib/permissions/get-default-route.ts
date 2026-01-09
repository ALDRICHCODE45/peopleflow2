/**
 * Determina la ruta por defecto basada en los permisos del usuario
 *
 * Este módulo define la lógica para redirigir a los usuarios a la ruta
 * apropiada según sus permisos después del login.
 */

import {
  ROUTE_PERMISSIONS,
  ROUTE_PRIORITY,
} from "@/core/shared/helpers/route-permissions.config";
import { hasPermission } from "@/core/shared/helpers/permission-checker";
import { SUPER_ADMIN_PERMISSION_NAME } from "@/core/shared/constants/permissions";

/**
 * Ruta por defecto para super administradores
 */
const DEFAULT_SUPER_ADMIN_ROUTE = "/super-admin";

/**
 * Ruta por defecto para administradores normales
 */
const DEFAULT_ADMIN_ROUTE = "/admin/usuarios";

/**
 * Ruta de fallback si el usuario no tiene acceso a ninguna ruta
 */
const FALLBACK_ROUTE = "/access-denied";

/**
 * Obtiene la ruta por defecto basada en los permisos del usuario
 *
 * @param userPermissions - Array de permisos del usuario
 * @returns La ruta por defecto a la que debe ser redirigido el usuario
 *
 * @example
 * // Usuario super admin
 * getDefaultRoute(["super:admin"]) // "/super-admin"
 *
 * // Usuario con permiso de usuarios
 * getDefaultRoute(["usuarios:acceder"]) // "/admin/usuarios"
 *
 * // Usuario con permiso de finanzas
 * getDefaultRoute(["ingresos:acceder"]) // "/finanzas/ingresos"
 *
 * // Usuario sin permisos
 * getDefaultRoute([]) // "/access-denied"
 */
export function getDefaultRoute(userPermissions: string[]): string {
  // Si no tiene permisos, redirigir a acceso denegado
  if (!userPermissions || userPermissions.length === 0) {
    return FALLBACK_ROUTE;
  }

  // Si el usuario es super admin, redirigir a dashboard de super admin
  if (userPermissions.includes(SUPER_ADMIN_PERMISSION_NAME)) {
    return DEFAULT_SUPER_ADMIN_ROUTE;
  }

  // Iterar sobre las rutas en orden de prioridad
  for (const route of ROUTE_PRIORITY) {
    // Obtener el permiso requerido para esta ruta
    const requiredPermission = ROUTE_PERMISSIONS[route];

    // Si la ruta no requiere permisos específicos, continuar
    if (!requiredPermission) {
      continue;
    }

    // Verificar si el usuario tiene el permiso requerido
    if (hasPermission(userPermissions, requiredPermission)) {
      return route;
    }
  }

  // Si no se encontró ninguna ruta accesible, buscar en todas las rutas configuradas
  // (por si hay rutas que no están en la lista de prioridad)
  for (const [route, requiredPermission] of Object.entries(ROUTE_PERMISSIONS)) {
    // Saltar rutas especiales
    if (route === "/super-admin") continue;

    if (hasPermission(userPermissions, requiredPermission)) {
      return route;
    }
  }

  // Si no tiene acceso a ninguna ruta, redirigir a acceso denegado
  return FALLBACK_ROUTE;
}

/**
 * Verifica si el usuario debe ser redirigido al dashboard de super admin
 *
 * @param userPermissions - Array de permisos del usuario
 * @returns true si debe ir al dashboard de super admin
 */
export function shouldRedirectToSuperAdmin(userPermissions: string[]): boolean {
  return userPermissions.includes(SUPER_ADMIN_PERMISSION_NAME);
}

/**
 * Obtiene la primera ruta accesible para un usuario
 *
 * @param userPermissions - Array de permisos del usuario
 * @param preferredRoutes - Rutas preferidas en orden de prioridad
 * @returns La primera ruta accesible o el fallback
 */
export function getFirstAccessibleRoute(
  userPermissions: string[],
  preferredRoutes: string[] = ROUTE_PRIORITY
): string {
  for (const route of preferredRoutes) {
    const requiredPermission = ROUTE_PERMISSIONS[route];
    if (!requiredPermission || hasPermission(userPermissions, requiredPermission)) {
      return route;
    }
  }
  return FALLBACK_ROUTE;
}

/**
 * Exporta las rutas por defecto como constantes
 */
export const DEFAULT_ROUTES = {
  SUPER_ADMIN: DEFAULT_SUPER_ADMIN_ROUTE,
  ADMIN: DEFAULT_ADMIN_ROUTE,
  FALLBACK: FALLBACK_ROUTE,
};
