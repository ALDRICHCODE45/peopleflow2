"use client";

import { useCallback, useMemo } from "react";
import { usePermissionContext } from "../context/PermissionContext";
import {
  hasPermission as checkHasPermission,
  hasAnyPermission as checkHasAnyPermission,
  hasAllPermissions as checkHasAllPermissions,
  isSuperAdmin as checkIsSuperAdmin,
  hasResourceAccess as checkHasResourceAccess,
} from "../helpers/permission-checker";

/**
 * Hook centralizado para gestionar permisos del usuario
 *
 * Proporciona:
 * - permissions: Array de permisos del usuario en el tenant actual
 * - hasPermission: Verifica si tiene un permiso específico
 * - hasAnyPermission: Verifica si tiene al menos uno de los permisos
 * - hasAllPermissions: Verifica si tiene todos los permisos
 * - hasResourceAccess: Verifica si tiene acceso a un recurso (cualquier acción)
 * - isSuperAdmin: Si el usuario es super admin
 * - isLoading: Estado de carga
 * - refresh: Función para refrescar permisos
 *
 * @example
 * ```tsx
 * "use client"
 * import { usePermissions } from "@core/shared/hooks/use-permissions"
 *
 * function MyComponent() {
 *   const { hasPermission, isSuperAdmin, isLoading } = usePermissions();
 *
 *   if (isLoading) return <div>Cargando...</div>;
 *
 *   if (!hasPermission("facturas:acceder")) {
 *     return <div>No tienes acceso a facturas</div>;
 *   }
 *
 *   return <div>Contenido de facturas</div>;
 * }
 * ```
 */
export function usePermissions() {
  const {
    permissions,
    isSuperAdmin: superAdmin,
    isLoading,
    error,
    refresh,
    tenantId,
  } = usePermissionContext();

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      // Super admin siempre tiene todos los permisos
      if (superAdmin) return true;
      return checkHasPermission(permissions, permission);
    },
    [permissions, superAdmin]
  );

  /**
   * Verifica si el usuario tiene al menos uno de los permisos
   */
  const hasAnyPermission = useCallback(
    (permissionList: string[]): boolean => {
      if (superAdmin) return true;
      return checkHasAnyPermission(permissions, permissionList);
    },
    [permissions, superAdmin]
  );

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   */
  const hasAllPermissions = useCallback(
    (permissionList: string[]): boolean => {
      if (superAdmin) return true;
      return checkHasAllPermissions(permissions, permissionList);
    },
    [permissions, superAdmin]
  );

  /**
   * Verifica si el usuario tiene acceso a un recurso (cualquier acción)
   */
  const hasResourceAccess = useCallback(
    (resource: string): boolean => {
      if (superAdmin) return true;
      return checkHasResourceAccess(permissions, resource);
    },
    [permissions, superAdmin]
  );

  /**
   * Verifica si el usuario es super admin
   */
  const isSuperAdmin = useMemo(() => {
    return superAdmin || checkIsSuperAdmin(permissions);
  }, [superAdmin, permissions]);

  /**
   * Verifica si el usuario es admin (tiene acceso a admin:*)
   */
  const isAdmin = useMemo(() => {
    return isSuperAdmin || checkHasResourceAccess(permissions, "usuarios");
  }, [isSuperAdmin, permissions]);

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasResourceAccess,
    isSuperAdmin,
    isAdmin,
    isLoading,
    error,
    refresh,
    tenantId,
  };
}

export type UsePermissionsReturn = ReturnType<typeof usePermissions>;
