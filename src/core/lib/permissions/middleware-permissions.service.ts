/**
 * Servicio para extraer y verificar permisos en el middleware/proxy de Next.js 16
 *
 * Este servicio maneja la extracción de permisos de la sesión de Better Auth
 * y proporciona métodos para verificar permisos en el middleware.
 */

import { hasPermission } from "@/core/shared/helpers/permission-checker";
import { SUPER_ADMIN_PERMISSION_NAME } from "@/core/shared/constants/permissions";

/**
 * Tipo para representar la estructura de sesión de Better Auth
 */
type SessionData = {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    permissions?: string[];
    [key: string]: unknown;
  };
  session?: {
    id?: string;
    token?: string;
    activeTenantId?: string | null;
    [key: string]: unknown;
  };
  permissions?: string[];
  [key: string]: unknown;
};

/**
 * Servicio para manejar permisos en el middleware/proxy
 */
export class MiddlewarePermissionsService {
  /**
   * Extrae los permisos del objeto de sesión de Better Auth
   * Intenta múltiples estrategias para encontrar los permisos
   *
   * @param session - El objeto de sesión
   * @returns Array de permisos del usuario
   */
  static extractPermissions(session: unknown): string[] {
    if (!session) {
      return [];
    }

    const sessionData = session as SessionData;

    // Estrategia 1: session.user.permissions (estructura más común)
    if (
      sessionData.user?.permissions &&
      Array.isArray(sessionData.user.permissions)
    ) {
      return sessionData.user.permissions;
    }

    // Estrategia 2: Permisos directamente en el objeto session
    if (Array.isArray(sessionData.permissions)) {
      return sessionData.permissions;
    }

    // Estrategia 3: Intentar acceder como objeto plano con propiedad permissions
    if (typeof sessionData === "object" && sessionData !== null) {
      const permissions = (sessionData as Record<string, unknown>).permissions;
      if (Array.isArray(permissions)) {
        return permissions;
      }

      // Estrategia 4: Buscar en cualquier propiedad que contenga 'user'
      const keys = Object.keys(sessionData);
      for (const key of keys) {
        const value = (sessionData as Record<string, unknown>)[key];
        if (value && typeof value === "object" && "permissions" in value) {
          const perms = (value as { permissions?: unknown }).permissions;
          if (Array.isArray(perms)) {
            return perms;
          }
        }
      }
    }

    // Si no se encuentran permisos, loguear en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[MiddlewarePermissionsService] No se pudieron extraer permisos de:",
        {
          hasSession: !!session,
          sessionKeys:
            session && typeof session === "object"
              ? Object.keys(session)
              : [],
        }
      );
    }

    return [];
  }

  /**
   * Extrae el ID del tenant activo de la sesión
   *
   * @param session - El objeto de sesión
   * @returns ID del tenant activo o null
   */
  static extractActiveTenantId(session: unknown): string | null {
    if (!session) {
      return null;
    }

    const sessionData = session as SessionData;

    // Buscar en session.session.activeTenantId
    if (sessionData.session?.activeTenantId) {
      return sessionData.session.activeTenantId;
    }

    // Buscar directamente en session
    if ((sessionData as Record<string, unknown>).activeTenantId) {
      return (sessionData as Record<string, unknown>).activeTenantId as string;
    }

    return null;
  }

  /**
   * Verifica si el usuario tiene permiso de super:admin
   *
   * @param permissions - Array de permisos del usuario
   * @returns true si tiene permiso super:admin
   */
  static hasSuperAdminPermission(permissions: string[]): boolean {
    return permissions.includes(SUPER_ADMIN_PERMISSION_NAME);
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   * Incluye verificación de super:admin primero para eficiencia
   *
   * @param permissions - Array de permisos del usuario
   * @param requiredPermission - Permiso requerido
   * @returns true si tiene el permiso
   */
  static hasRequiredPermission(
    permissions: string[],
    requiredPermission: string
  ): boolean {
    // Verificar super:admin primero (más rápido)
    if (this.hasSuperAdminPermission(permissions)) {
      return true;
    }

    // Verificar permiso específico usando el checker existente
    return hasPermission(permissions, requiredPermission);
  }

  /**
   * Método de utilidad para logging (solo en desarrollo)
   *
   * @param session - Objeto de sesión
   * @param pathname - Ruta que se está verificando
   * @param hasAccess - Si tiene acceso o no
   */
  static logPermissionCheck(
    session: unknown,
    pathname: string,
    hasAccess: boolean
  ): void {
    if (process.env.NODE_ENV === "development") {
      const permissions = this.extractPermissions(session);
      console.log("[Permission Check]", {
        pathname,
        hasAccess,
        permissionsCount: permissions.length,
        hasSuperAdmin: this.hasSuperAdminPermission(permissions),
        permissions: permissions.slice(0, 5), // Solo primeros 5 para no saturar
      });
    }
  }
}
