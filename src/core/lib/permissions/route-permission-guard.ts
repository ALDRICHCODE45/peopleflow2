/**
 * Guard para verificación de permisos en rutas
 *
 * Este guard centraliza la lógica de verificación de permisos para rutas,
 * implementando un patrón Strategy para diferentes tipos de verificación.
 */

import {
  getRequiredPermission,
  requiresPermission,
  isPublicRoute,
  isAuthenticatedRoute,
} from "@/core/shared/helpers/route-permissions.config";
import { MiddlewarePermissionsService } from "./middleware-permissions.service";

/**
 * Tipo para el objeto de sesión
 */
type SessionData = unknown;

/**
 * Resultado de la verificación de acceso
 */
export type AccessCheckResult = {
  hasAccess: boolean;
  reason: string;
  requiredPermission?: string;
};

/**
 * Guard para verificar permisos de rutas en el middleware/proxy
 */
export class RoutePermissionGuard {
  /**
   * Verifica si el usuario puede acceder a una ruta específica
   *
   * @param session - Objeto de sesión de Better Auth
   * @param pathname - Ruta que se está verificando
   * @returns Resultado de la verificación de acceso
   */
  static canAccessRoute(
    session: SessionData,
    pathname: string
  ): AccessCheckResult {
    // 1. Verificar si es ruta pública
    if (isPublicRoute(pathname)) {
      return {
        hasAccess: true,
        reason: "Ruta pública",
      };
    }

    // 2. Si no hay sesión, no tiene acceso
    if (!session) {
      return {
        hasAccess: false,
        reason: "No autenticado",
      };
    }

    // 3. Verificar si es ruta que solo requiere autenticación
    if (isAuthenticatedRoute(pathname)) {
      return {
        hasAccess: true,
        reason: "Usuario autenticado",
      };
    }

    // 4. Extraer permisos del usuario
    const userPermissions =
      MiddlewarePermissionsService.extractPermissions(session);

    // 5. Verificar si tiene permiso de super:admin (bypass total)
    if (MiddlewarePermissionsService.hasSuperAdminPermission(userPermissions)) {
      return {
        hasAccess: true,
        reason: "Super administrador",
      };
    }

    // 6. Verificar si la ruta requiere permisos
    if (!requiresPermission(pathname)) {
      // Ruta no requiere permisos específicos, permitir acceso
      return {
        hasAccess: true,
        reason: "Ruta sin permisos requeridos",
      };
    }

    // 7. Obtener permiso requerido para la ruta
    const requiredPermission = getRequiredPermission(pathname);

    if (!requiredPermission) {
      // Ruta no tiene permiso requerido configurado
      // Por defecto permitir acceso si está autenticado
      return {
        hasAccess: true,
        reason: "Permiso no configurado, acceso permitido por defecto",
      };
    }

    // 8. Verificar si el usuario tiene el permiso requerido
    const hasPermission = MiddlewarePermissionsService.hasRequiredPermission(
      userPermissions,
      requiredPermission
    );

    // Logging en desarrollo
    MiddlewarePermissionsService.logPermissionCheck(
      session,
      pathname,
      hasPermission
    );

    return {
      hasAccess: hasPermission,
      reason: hasPermission ? "Permiso verificado" : "Permiso insuficiente",
      requiredPermission,
    };
  }

  /**
   * Verifica acceso de forma rápida (solo retorna boolean)
   * Útil cuando no necesitas detalles del resultado
   *
   * @param session - Objeto de sesión
   * @param pathname - Ruta a verificar
   * @returns true si tiene acceso
   */
  static hasAccess(session: SessionData, pathname: string): boolean {
    return this.canAccessRoute(session, pathname).hasAccess;
  }

  /**
   * Verifica si el usuario está autenticado
   *
   * @param session - Objeto de sesión
   * @returns true si está autenticado
   */
  static isAuthenticated(session: SessionData): boolean {
    return !!session;
  }

  /**
   * Verifica si el usuario es super admin
   *
   * @param session - Objeto de sesión
   * @returns true si es super admin
   */
  static isSuperAdmin(session: SessionData): boolean {
    if (!session) return false;
    const permissions =
      MiddlewarePermissionsService.extractPermissions(session);
    return MiddlewarePermissionsService.hasSuperAdminPermission(permissions);
  }
}
