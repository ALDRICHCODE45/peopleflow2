"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { vacancyQueryKeys } from "@core/shared/constants/query-keys";
import { getRecruiterAssignmentHistoryAction } from "@features/vacancy/server/presentation/actions/getRecruiterAssignmentHistory.action";
import type { RecruiterAssignmentHistoryDTO } from "../types/vacancy.types";

export function useRecruiterAssignmentHistory(
  vacancyId: string | null,
): UseQueryResult<RecruiterAssignmentHistoryDTO[], Error> {
  const { tenant } = useTenant();

  return useQuery({
    queryKey:
      tenant?.id && vacancyId
        ? vacancyQueryKeys.assignmentHistory(tenant.id, vacancyId)
        : ["recruiter-assignment-history", "no-tenant"],
    queryFn: async (): Promise<RecruiterAssignmentHistoryDTO[]> => {
      if (!vacancyId) throw new Error("No vacancyId");
      const result = await getRecruiterAssignmentHistoryAction(vacancyId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!vacancyId && !!tenant?.id,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
