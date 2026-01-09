"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { getCurrentTenantAction } from "../../server/presentation/actions/tenant.actions";
import type { Tenant, TenantContextType } from "../types";

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  isLoading: true,
  refresh: async () => {},
});

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

interface TenantProviderProps {
  children: ReactNode;
}

/**
 * Intervalo para verificación silenciosa de cambios (2 minutos)
 * Solo verifica si hay cambios, no muestra loading
 */
const SILENT_CHECK_INTERVAL = 120000; // 2 minutos

export function TenantProvider({ children }: TenantProviderProps) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Refresh completo - muestra loading
   * Se usa en la carga inicial
   */
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getCurrentTenantAction();
      if (!result.error && result.tenant) {
        setTenant(result.tenant);
      } else {
        setTenant(null);
      }
    } catch (error) {
      console.error("Error refreshing tenant:", error);
      setTenant(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh silencioso - NO muestra loading
   * Se usa para verificar cambios en segundo plano
   * Solo actualiza el estado si hay un cambio real
   */
  const silentRefresh = useCallback(async () => {
    try {
      const result = await getCurrentTenantAction();
      if (!result.error && result.tenant) {
        // Solo actualizar si cambió el tenant
        setTenant((currentTenant) => {
          if (currentTenant?.id !== result.tenant?.id) {
            // El tenant cambió - esto puede pasar si un admin lo modificó
            return result.tenant;
          }
          return currentTenant;
        });
      }
      // No hacer nada si hay error - mantener el estado actual
    } catch (error) {
      // Silenciosamente ignorar errores en el check de fondo
      console.debug("Silent tenant check failed:", error);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Verificación silenciosa periódica
  useEffect(() => {
    // Solo iniciar el interval después de la carga inicial
    if (isLoading) return;

    const interval = setInterval(silentRefresh, SILENT_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [isLoading, silentRefresh]);

  return (
    <TenantContext.Provider value={{ tenant, isLoading, refresh }}>
      {children}
    </TenantContext.Provider>
  );
}
