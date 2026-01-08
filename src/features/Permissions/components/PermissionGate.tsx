'use client';

import { ReactNode, useEffect, useState } from 'react';
import { checkPermissionAction } from '@/app/actions/permissions';
import { useTenant } from '../../Tenants/context/TenantContext';

interface PermissionGateProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente que protege contenido según permisos del usuario
 * Solo muestra el contenido si el usuario tiene el permiso requerido
 */
export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { tenant } = useTenant();
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, [permission, tenant?.id]);

  const checkPermission = async () => {
    setIsLoading(true);
    const result = await checkPermissionAction(permission, tenant?.id || null);
    setHasPermission(result);
    setIsLoading(false);
  };

  if (isLoading) {
    return null; // O mostrar un spinner
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
