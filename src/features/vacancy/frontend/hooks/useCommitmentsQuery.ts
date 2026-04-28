"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import type { VacancyCommitmentDTO } from "../types/vacancy.types";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { listCommitmentsAction } from "../../server/presentation/actions/listCommitments.action";
import { vacancyCommitmentsQueryKeys } from "@core/shared/constants/query-keys";

export function useCommitmentsQuery(
  vacancyId: string
): UseQueryResult<VacancyCommitmentDTO[], Error> {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: vacancyCommitmentsQueryKeys.list(tenant?.id ?? "", vacancyId),
    queryFn: async () => {
      const result = await listCommitmentsAction({ vacancyId });
      if (result.error) {
        throw new Error(result.error);
      }
      return result.commitments ?? [];
    },
    enabled: !!tenant?.id && !!vacancyId,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
