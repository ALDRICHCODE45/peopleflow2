"use client";

import { usePermissions } from "@/core/shared/hooks/use-permissions";
import { ReactNode } from "react";

interface PermissionGuardProps {
  /** Contenido a mostrar si tiene permisos */
  children: ReactNode;
  /** Permiso único requerido */
  permission?: string;
  /** Array de permisos (si requireAll es true, necesita todos; si es false, necesita al menos uno) */
  permissions?: string[];
  /** Componente a mostrar si no tiene permisos */
  fallback?: ReactNode;
  /** Si es true, requiere todos los permisos; si es false, requiere al menos uno (default: false) */
  requireAll?: boolean;
}

/**
 * Componente que protege contenido basado en permisos del usuario
 *
 * @example
 * ```tsx
 * // Permiso único
 * <PermissionGuard permission={PermissionActions.usuarios.acceder}>
 *   <UserTable />
 * </PermissionGuard>
 *
 * // Múltiples permisos (necesita al menos uno)
 * <PermissionGuard
 *   permissions={[
 *     PermissionActions.usuarios.acceder,
 *     PermissionActions.usuarios.gestionar,
 *   ]}
 * >
 *   <UserTable />
 * </PermissionGuard>
 *
 * // Múltiples permisos (necesita todos)
 * <PermissionGuard
 *   permissions={[
 *     PermissionActions.usuarios.acceder,
 *     PermissionActions.usuarios.editar,
 *   ]}
 *   requireAll
 * >
 *   <EditUserButton />
 * </PermissionGuard>
 *
 * // Con fallback
 * <PermissionGuard
 *   permission={PermissionActions.usuarios.eliminar}
 *   fallback={<span>No tienes permiso para eliminar</span>}
 * >
 *   <DeleteButton />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  children,
  permission,
  permissions,
  fallback = null,
  requireAll = false,
}: PermissionGuardProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    isLoading,
  } = usePermissions();

  // Mientras carga, no mostrar nada para evitar flickering
  if (isLoading) {
    return null;
  }

  // Super admin tiene acceso a todo
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Verificar permiso único
  if (permission) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // Verificar múltiples permisos
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // Si no se especifican permisos, no mostrar contenido por seguridad
  return <>{fallback}</>;
}
