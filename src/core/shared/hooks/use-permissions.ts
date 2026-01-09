"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { getUserPermissionsAction } from "@/features/auth-rbac/server/presentation/actions/permission.actions";
import { isSuperAdminAction } from "@/features/auth-rbac/server/presentation/actions/user.actions";
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
  const { tenant, isLoading: isTenantLoading } = useTenant();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [superAdmin, setSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga los permisos del usuario para el tenant actual
   */
  const loadPermissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Cargar permisos y verificar si es super admin en paralelo
      const [permissionsResult, superAdminResult] = await Promise.all([
        getUserPermissionsAction(tenant?.id || null),
        isSuperAdminAction(),
      ]);

      if (permissionsResult.error) {
        setError(permissionsResult.error);
        setPermissions([]);
      } else {
        setPermissions(permissionsResult.permissions);
      }

      setSuperAdmin(superAdminResult);
    } catch (err) {
      console.error("Error loading permissions:", err);
      setError("Error al cargar permisos");
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.id]);

  // Recargar permisos cuando cambia el tenant
  useEffect(() => {
    if (!isTenantLoading) {
      loadPermissions();
    }
  }, [loadPermissions, isTenantLoading]);

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
    isLoading: isLoading || isTenantLoading,
    error,
    refresh: loadPermissions,
    tenantId: tenant?.id || null,
  };
}

export type UsePermissionsReturn = ReturnType<typeof usePermissions>;
