"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { getCurrentTenantAction } from "@/app/actions/tenants";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

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

export function TenantProvider({ children }: TenantProviderProps) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
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
  };

  useEffect(() => {
    refresh();

    // Escuchar cambios en la sesión para refrescar el tenant
    const interval = setInterval(() => {
      refresh();
    }, 30000); // Refrescar cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, isLoading, refresh }}>
      {children}
    </TenantContext.Provider>
  );
}
