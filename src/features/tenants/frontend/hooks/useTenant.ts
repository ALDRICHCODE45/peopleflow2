"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getUserTenantsAction,
  switchTenantAction,
  getCurrentTenantAction,
} from "../../server/presentation/actions/tenant.actions";
import type { Tenant, TenantWithRoles } from "../types";

/**
 * Hook para gestionar tenants del usuario
 */
export function useUserTenants() {
  const [tenants, setTenants] = useState<TenantWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTenants = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getUserTenantsAction();

    if (result.error) {
      setError(result.error);
    } else {
      setTenants(result.tenants);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  return {
    tenants,
    isLoading,
    error,
    refresh: loadTenants,
  };
}

/**
 * Hook para obtener el tenant actual
 */
export function useCurrentTenant() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCurrentTenant = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getCurrentTenantAction();

    if (result.error) {
      setError(result.error);
    } else {
      setTenant(result.tenant);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadCurrentTenant();
  }, [loadCurrentTenant]);

  return {
    tenant,
    isLoading,
    error,
    refresh: loadCurrentTenant,
  };
}

/**
 * Hook para cambiar el tenant activo
 */
export function useSwitchTenant() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchTenant = useCallback(async (tenantId: string | null) => {
    setIsLoading(true);
    setError(null);

    const result = await switchTenantAction(tenantId);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return false;
    }

    setIsLoading(false);
    return true;
  }, []);

  return {
    switchTenant,
    isLoading,
    error,
  };
}
