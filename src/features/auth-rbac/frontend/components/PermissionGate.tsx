"use client";

import { ReactNode } from "react";
import { usePermissions } from "@core/shared/hooks/use-permissions";

interface PermissionGateProps {
  /** Permiso requerido para mostrar el contenido */
  permission?: string;
  /** Array de permisos - muestra si tiene AL MENOS UNO */
  anyPermission?: string[];
  /** Array de permisos - muestra si tiene TODOS */
  allPermissions?: string[];
  /** Contenido a mostrar si tiene el permiso */
  children: ReactNode;
  /** Contenido a mostrar si NO tiene el permiso */
  fallback?: ReactNode;
  /** Contenido a mostrar mientras carga */
  loading?: ReactNode;
}

/**
 * Componente que protege contenido según permisos del usuario
 * Solo muestra el contenido si el usuario tiene el permiso requerido
 *
 * @example
 * ```tsx
 * // Permiso único
 * <PermissionGate permission="facturas:crear">
 *   <Button>Crear Factura</Button>
 * </PermissionGate>
 *
 * // Cualquier permiso del array
 * <PermissionGate anyPermission={["facturas:crear", "facturas:editar"]}>
 *   <Button>Gestionar Facturas</Button>
 * </PermissionGate>
 *
 * // Todos los permisos del array
 * <PermissionGate allPermissions={["facturas:crear", "facturas:editar"]}>
 *   <Button>Control Total de Facturas</Button>
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  permission,
  anyPermission,
  allPermissions,
  children,
  fallback = null,
  loading = null,
}: PermissionGateProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading,
  } = usePermissions();

  if (isLoading) {
    return <>{loading}</>;
  }

  // Verificar permisos según el tipo de prop proporcionado
  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (anyPermission && anyPermission.length > 0) {
    hasAccess = hasAnyPermission(anyPermission);
  } else if (allPermissions && allPermissions.length > 0) {
    hasAccess = hasAllPermissions(allPermissions);
  } else {
    // Si no se especifica ningún permiso, mostrar el contenido
    hasAccess = true;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Componente que muestra contenido SOLO si el usuario es superadmin
 */
export function SuperAdminGate({
  children,
  fallback = null,
  loading = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
}) {
  const { isSuperAdmin, isLoading } = usePermissions();

  if (isLoading) {
    return <>{loading}</>;
  }

  if (!isSuperAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Componente que muestra contenido SOLO si el usuario es admin
 */
export function AdminGate({
  children,
  fallback = null,
  loading = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
}) {
  const { isAdmin, isLoading } = usePermissions();

  if (isLoading) {
    return <>{loading}</>;
  }

  if (!isAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
