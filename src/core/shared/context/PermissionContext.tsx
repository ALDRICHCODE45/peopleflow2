"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { getUserPermissionsAction } from "@/features/auth-rbac/server/presentation/actions/permission.actions";
import { isSuperAdminAction } from "@/features/auth-rbac/server/presentation/actions/user.actions";

interface PermissionContextType {
  permissions: string[];
  isSuperAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  tenantId: string | null;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

export function usePermissionContext() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error(
      "usePermissionContext must be used within PermissionProvider"
    );
  }
  return context;
}

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { tenant, isLoading: isTenantLoading } = useTenant();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [superAdmin, setSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
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

  // Cargar permisos cuando el tenant esté listo
  useEffect(() => {
    if (!isTenantLoading) {
      loadPermissions();
    }
  }, [loadPermissions, isTenantLoading]);

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        isSuperAdmin: superAdmin,
        isLoading: isLoading || isTenantLoading,
        error,
        refresh: loadPermissions,
        tenantId: tenant?.id || null,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}
