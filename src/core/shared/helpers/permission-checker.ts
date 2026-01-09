/**
 * Funciones de utilidad para verificar permisos en el cliente y servidor
 */

import { SUPER_ADMIN_PERMISSION_NAME } from "../constants/permissions";

/**
 * Verifica si un array de permisos contiene un permiso específico
 * @param userPermissions - Array de permisos del usuario
 * @param permission - Permiso a verificar
 * @returns true si tiene el permiso, super:admin, o permiso modular equivalente
 */
export function hasPermission(
  userPermissions: string[],
  permission: string
): boolean {
  // super:admin tiene acceso total
  if (userPermissions.includes(SUPER_ADMIN_PERMISSION_NAME)) {
    return true;
  }

  // Verificar permiso exacto
  if (userPermissions.includes(permission)) {
    return true;
  }

  // Verificar permiso modular (:gestionar incluye todas las acciones)
  const parsed = parsePermission(permission);
  if (parsed) {
    const modularPermission = `${parsed.resource}:gestionar`;
    if (userPermissions.includes(modularPermission)) {
      return true;
    }
  }

  return false;
}

/**
 * Verifica si un array de permisos contiene al menos uno de los permisos especificados
 * @param userPermissions - Array de permisos del usuario
 * @param permissions - Array de permisos a verificar
 * @returns true si tiene al menos uno de los permisos
 */
export function hasAnyPermission(
  userPermissions: string[],
  permissions: string[]
): boolean {
  // super:admin tiene acceso total
  if (userPermissions.includes(SUPER_ADMIN_PERMISSION_NAME)) {
    return true;
  }

  return permissions.some((permission) =>
    hasPermission(userPermissions, permission)
  );
}

/**
 * Verifica si un array de permisos contiene todos los permisos especificados
 * @param userPermissions - Array de permisos del usuario
 * @param permissions - Array de permisos a verificar
 * @returns true si tiene todos los permisos
 */
export function hasAllPermissions(
  userPermissions: string[],
  permissions: string[]
): boolean {
  // super:admin tiene acceso total
  if (userPermissions.includes(SUPER_ADMIN_PERMISSION_NAME)) {
    return true;
  }

  return permissions.every((permission) =>
    hasPermission(userPermissions, permission)
  );
}

/**
 * Verifica si el usuario es super administrador
 * @param userPermissions - Array de permisos del usuario
 * @returns true si es super admin
 */
export function isSuperAdmin(userPermissions: string[]): boolean {
  return userPermissions.includes(SUPER_ADMIN_PERMISSION_NAME);
}

/**
 * Parsea un permiso en recurso y acción
 * @param permission - Permiso en formato "recurso:acción"
 * @returns Objeto con recurso y acción, o null si el formato es inválido
 */
export function parsePermission(
  permission: string
): { resource: string; action: string } | null {
  const parts = permission.split(":");
  if (parts.length !== 2) {
    return null;
  }
  return { resource: parts[0], action: parts[1] };
}

/**
 * Verifica si el usuario tiene acceso a un recurso específico (cualquier acción)
 * @param userPermissions - Array de permisos del usuario
 * @param resource - Recurso a verificar
 * @returns true si tiene algún permiso sobre el recurso
 */
export function hasResourceAccess(
  userPermissions: string[],
  resource: string
): boolean {
  // super:admin tiene acceso total
  if (userPermissions.includes(SUPER_ADMIN_PERMISSION_NAME)) {
    return true;
  }

  return userPermissions.some((permission) => {
    const parsed = parsePermission(permission);
    return parsed?.resource === resource;
  });
}

/**
 * Obtiene todos los recursos a los que el usuario tiene acceso
 * @param userPermissions - Array de permisos del usuario
 * @returns Array de recursos accesibles
 */
export function getAccessibleResources(userPermissions: string[]): string[] {
  const resources = new Set<string>();

  for (const permission of userPermissions) {
    const parsed = parsePermission(permission);
    if (parsed) {
      resources.add(parsed.resource);
    }
  }

  return Array.from(resources);
}

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

/**
 * Filtra permisos por recurso
 * @param userPermissions - Array de permisos del usuario
 * @param resource - Recurso a filtrar
 * @returns Array de permisos para ese recurso
 */
export function getPermissionsForResource(
  userPermissions: string[],
  resource: string
): string[] {
  return userPermissions.filter((permission) => {
    const parsed = parsePermission(permission);
    return parsed?.resource === resource;
  });
}
