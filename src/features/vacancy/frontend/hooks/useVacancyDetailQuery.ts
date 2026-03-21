"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { getVacancyDetailAction } from "@features/vacancy/server/presentation/actions/getVacancyDetail.action";
import type { VacancyDTO } from "../types/vacancy.types";
import { vacancyQueryKeys } from "@core/shared/constants/query-keys";

/** @deprecated Use vacancyQueryKeys.detail() directly */
export const getVacancyDetailQueryKey = (
  tenantId: string,
  vacancyId: string
) => vacancyQueryKeys.detail(tenantId, vacancyId);

export function useVacancyDetailQuery(vacancyId: string | null): UseQueryResult<VacancyDTO, Error> {
  const { tenant } = useTenant();

  return useQuery({
    queryKey:
      tenant?.id && vacancyId
        ? vacancyQueryKeys.detail(tenant.id, vacancyId)
        : ["vacancy", "detail", "no-tenant"],
    queryFn: async (): Promise<VacancyDTO> => {
      if (!vacancyId) throw new Error("No vacancyId");
      const result = await getVacancyDetailAction(vacancyId);
      if (result.error) throw new Error(result.error);
      if (!result.vacancy) throw new Error("No se encontró la vacante");
      return result.vacancy;
    },
    enabled: !!vacancyId && !!tenant?.id,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
