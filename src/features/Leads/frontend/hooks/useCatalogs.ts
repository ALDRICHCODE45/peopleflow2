"use client";

import { useQuery } from "@tanstack/react-query";
import type { Sector, Subsector, LeadOrigin } from "../types";
import {
  getSectorsAction,
  getSubsectorsBySectorAction,
  getLeadOriginsAction,
} from "../../server/presentation/actions/catalog.actions";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";

/**
 * Hook para obtener sectores
 */
export function useSectors() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["sectors", tenant?.id],
    queryFn: async (): Promise<Sector[]> => {
      const result = await getSectorsAction();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.sectors;
    },
    enabled: !!tenant?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener subsectores de un sector
 */
export function useSubsectorsBySector(sectorId: string | null) {
  return useQuery({
    queryKey: ["subsectors", "by-sector", sectorId],
    queryFn: async (): Promise<Subsector[]> => {
      if (!sectorId) return [];
      const result = await getSubsectorsBySectorAction(sectorId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.subsectors;
    },
    enabled: !!sectorId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener orígenes de leads
 */
export function useLeadOrigins() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["lead-origins", tenant?.id],
    queryFn: async (): Promise<LeadOrigin[]> => {
      const result = await getLeadOriginsAction();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.origins;
    },
    enabled: !!tenant?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
