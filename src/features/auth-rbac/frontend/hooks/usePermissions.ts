"use client";

/**
 * Re-exportación del hook centralizado de permisos
 *
 * Este archivo mantiene compatibilidad hacia atrás con el código existente
 * que importa desde esta ubicación.
 *
 * Para nuevos desarrollos, se recomienda importar directamente desde:
 * @core/shared/hooks/use-permissions
 */

// Re-exportar el hook centralizado
export { usePermissions } from "@core/shared/hooks/use-permissions";
export type { UsePermissionsReturn } from "@core/shared/hooks/use-permissions";

// Re-exportar helpers
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isSuperAdmin,
  hasResourceAccess,
  parsePermission,
} from "@core/shared/helpers/permission-checker";

// Hooks específicos que usan el hook centralizado
import { usePermissions } from "@core/shared/hooks/use-permissions";

/**
 * Hook para verificar un permiso específico
 * @deprecated Usa usePermissions().hasPermission() en su lugar
 */
export function usePermission(permission: string, _tenantId?: string | null) {
  const { hasPermission, isLoading, refresh } = usePermissions();

  return {
    hasPermission: hasPermission(permission),
    isLoading,
    refresh,
  };
}

/**
 * Hook para obtener todos los permisos del usuario
 * @deprecated Usa usePermissions() en su lugar
 */
export function useUserPermissions(_tenantId?: string | null) {
  const { permissions, hasPermission, isLoading, error, refresh } =
    usePermissions();

  return {
    permissions,
    hasPermission,
    isLoading,
    error,
    refresh,
  };
}

/**
 * Hook para verificar si el usuario es superadmin
 * @deprecated Usa usePermissions().isSuperAdmin en su lugar
 */
export function useIsSuperAdmin() {
  const { isSuperAdmin, isLoading, refresh } = usePermissions();

  return {
    isSuperAdmin,
    isLoading,
    refresh,
  };
}
