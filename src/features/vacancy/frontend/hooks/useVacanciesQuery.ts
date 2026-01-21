"use client";

import { useQuery } from "@tanstack/react-query";
import type { VacancyStatus, Vacancy } from "../types/vacancy.types";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { getVacanciesAction } from "../../server/presentation/actions/getVacanciesAction.action";

export interface VacanciesQueryFilters {
  status?: VacancyStatus;
  search?: string;
}

// Query Key Factory - Incluye tenantId para evitar cache stale entre tenants
export const getVacanciesQueryKey = (
  tenantId: string,
  filters?: VacanciesQueryFilters,
) => ["vacancies", tenantId, filters] as const;

export function useVacanciesQuery(filters?: VacanciesQueryFilters) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id
      ? getVacanciesQueryKey(tenant.id, filters)
      : ["vacancies", "no-tenant", filters],
    queryFn: async (): Promise<Vacancy[]> => {
      const result = await getVacanciesAction(filters);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.vacancies;
    },
    enabled: !!tenant?.id,
  });
}
