"use client";

/**
 * STUB TEMPORAL — Fase 6 (Frontend Hooks)
 * Hook legacy de listado sin paginación.
 * TODO: Reemplazar con usePaginatedVacanciesQuery en Fase 6.
 */

import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import type { VacancyStatusType, VacancyDTO } from "../types/vacancy.types";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { getVacanciesAction } from "../../server/presentation/actions/getVacanciesAction.action";

export interface VacanciesQueryFilters {
  statuses?: VacancyStatusType[];
  search?: string;
}

// Query Key Factory - Incluye tenantId para evitar cache stale entre tenants
export const getVacanciesQueryKey = (
  tenantId: string,
  filters?: VacanciesQueryFilters,
) => ["vacancies", tenantId, filters] as const;

export function useVacanciesQuery(filters?: VacanciesQueryFilters): UseQueryResult<VacancyDTO[], Error> {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id
      ? getVacanciesQueryKey(tenant.id, filters)
      : ["vacancies", "no-tenant", filters],
    queryFn: async (): Promise<VacancyDTO[]> => {
      const result = await getVacanciesAction();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.vacancies;
    },
    enabled: !!tenant?.id,
  });
}
