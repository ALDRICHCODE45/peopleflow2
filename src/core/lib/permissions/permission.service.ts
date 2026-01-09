/**
 * Servicio centralizado para verificación de permisos
 *
 * ÚNICA fuente de verdad para toda la lógica de verificación de permisos.
 * Todos los demás módulos deben usar este servicio para verificar permisos.
 *
 * Características:
 * - Verificación de permisos individuales
 * - Verificación de múltiples permisos (any/all)
 * - Soporte para permisos modulares (:gestionar)
 * - Verificación de SuperAdmin
 */

import { SUPER_ADMIN_PERMISSION_NAME } from "@/core/shared/constants/permissions";

/**
 * Servicio centralizado para verificación de permisos
 */
export class PermissionService {
  /**
   * Verifica si el usuario tiene un permiso específico
   *
   * Orden de verificación:
   * 1. Si es SuperAdmin, tiene acceso total
   * 2. Si tiene el permiso exacto
   * 3. Si tiene el permiso modular (:gestionar) del mismo recurso
   *
   * @param userPermissions - Array de permisos del usuario
   * @param permission - Permiso a verificar (ej: "usuarios:editar")
   * @returns true si tiene el permiso
   */
  static hasPermission(userPermissions: string[], permission: string): boolean {
    // Validación de entrada
    if (!userPermissions || !Array.isArray(userPermissions)) {
      return false;
    }

    // SuperAdmin tiene acceso total
    if (this.isSuperAdmin(userPermissions)) {
      return true;
    }

    // Verificar permiso exacto
    if (userPermissions.includes(permission)) {
      return true;
    }

    // Verificar permiso modular (:gestionar incluye todas las acciones del recurso)
    const [resource, action] = permission.split(":");
    if (resource && action && action !== "gestionar") {
      const modularPermission = `${resource}:gestionar`;
      if (userPermissions.includes(modularPermission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verifica si el usuario tiene AL MENOS UNO de los permisos especificados
   *
   * @param userPermissions - Array de permisos del usuario
   * @param permissions - Array de permisos a verificar
   * @returns true si tiene al menos uno de los permisos
   */
  static hasAnyPermission(
    userPermissions: string[],
    permissions: string[]
  ): boolean {
    // Validación de entrada
    if (!permissions || permissions.length === 0) {
      return false;
    }

    // SuperAdmin tiene acceso total
    if (this.isSuperAdmin(userPermissions)) {
      return true;
    }

    return permissions.some((permission) =>
      this.hasPermission(userPermissions, permission)
    );
  }

  /**
   * Verifica si el usuario tiene TODOS los permisos especificados
   *
   * @param userPermissions - Array de permisos del usuario
   * @param permissions - Array de permisos a verificar
   * @returns true si tiene todos los permisos
   */
  static hasAllPermissions(
    userPermissions: string[],
    permissions: string[]
  ): boolean {
    // Validación de entrada
    if (!permissions || permissions.length === 0) {
      return false;
    }

    // SuperAdmin tiene acceso total
    if (this.isSuperAdmin(userPermissions)) {
      return true;
    }

    return permissions.every((permission) =>
      this.hasPermission(userPermissions, permission)
    );
  }

  /**
   * Verifica si el usuario es SuperAdmin
   *
   * @param userPermissions - Array de permisos del usuario
   * @returns true si tiene el permiso super:admin
   */
  static isSuperAdmin(userPermissions: string[]): boolean {
    if (!userPermissions || !Array.isArray(userPermissions)) {
      return false;
    }
    return userPermissions.includes(SUPER_ADMIN_PERMISSION_NAME);
  }

  /**
   * Verifica si el usuario tiene acceso a un recurso (cualquier acción)
   *
   * @param userPermissions - Array de permisos del usuario
   * @param resource - Nombre del recurso (ej: "usuarios", "ingresos")
   * @returns true si tiene algún permiso sobre el recurso
   */
  static hasResourceAccess(
    userPermissions: string[],
    resource: string
  ): boolean {
    // SuperAdmin tiene acceso total
    if (this.isSuperAdmin(userPermissions)) {
      return true;
    }

    return userPermissions.some((permission) => {
      const [permResource] = permission.split(":");
      return permResource === resource;
    });
  }

  /**
   * Parsea un permiso en recurso y acción
   *
   * @param permission - Permiso en formato "recurso:acción"
   * @returns Objeto con recurso y acción, o null si el formato es inválido
   */
  static parsePermission(
    permission: string
  ): { resource: string; action: string } | null {
    if (!permission || typeof permission !== "string") {
      return null;
    }

    const parts = permission.split(":");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return null;
    }

    return { resource: parts[0], action: parts[1] };
  }

  /**
   * Obtiene todos los recursos a los que el usuario tiene acceso
   *
   * @param userPermissions - Array de permisos del usuario
   * @returns Array de nombres de recursos únicos
   */
  static getAccessibleResources(userPermissions: string[]): string[] {
    if (!userPermissions || !Array.isArray(userPermissions)) {
      return [];
    }

    const resources = new Set<string>();

    for (const permission of userPermissions) {
      const parsed = this.parsePermission(permission);
      if (parsed && parsed.resource !== "super") {
        resources.add(parsed.resource);
      }
    }

    return Array.from(resources);
  }

  /**
   * Filtra permisos por recurso
   *
   * @param userPermissions - Array de permisos del usuario
   * @param resource - Recurso a filtrar
   * @returns Array de permisos para ese recurso
   */
  static getPermissionsForResource(
    userPermissions: string[],
    resource: string
  ): string[] {
    if (!userPermissions || !Array.isArray(userPermissions)) {
      return [];
    }

    return userPermissions.filter((permission) => {
      const parsed = this.parsePermission(permission);
      return parsed?.resource === resource;
    });
  }
}
