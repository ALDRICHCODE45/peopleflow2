"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

import { showToast } from "@/core/shared/components/ShowToast";
import { vacancyQueryKeys } from "@core/shared/constants/query-keys";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";

import { bulkReassignVacanciesAction } from "@features/vacancy/server/presentation/actions/bulkReassignVacancies.action";
import type {
  BulkActionResult,
  BulkReassignVacanciesInput,
} from "../types/vacancy.types";

const getReassignToastDescription = (result: BulkActionResult): string => {
  const failedDetails = result.failed
    .slice(0, 2)
    .map((item) => item.reason)
    .join(" · ");

  if (result.failed.length === 0) {
    return `Reasignadas ${result.succeeded.length} vacante${result.succeeded.length === 1 ? "" : "s"}`;
  }

  return `${result.succeeded.length} vacante${result.succeeded.length === 1 ? "" : "s"} reasignada${result.succeeded.length === 1 ? "" : "s"}. ${result.failed.length} no se pudieron reasignar${failedDetails ? `. ${failedDetails}` : ""}`;
};

export function useBulkReassignVacancies(): UseMutationResult<
  BulkActionResult,
  Error,
  BulkReassignVacanciesInput
> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (input: BulkReassignVacanciesInput) => {
      const result = await bulkReassignVacanciesAction(input);
      const payload = result.data ?? result.result;

      if (result.error || !payload) {
        throw new Error(result.error ?? "No se pudieron reasignar las vacantes seleccionadas");
      }

      return payload;
    },
    onSuccess: (result) => {
      const hasSucceeded = result.succeeded.length > 0;
      const hasFailed = result.failed.length > 0;

      showToast({
        type: hasSucceeded && hasFailed ? "warning" : hasFailed ? "error" : "success",
        title: hasSucceeded && hasFailed
          ? "Reasignación parcial"
          : hasFailed
            ? "No se reasignaron vacantes"
            : "Vacantes reasignadas",
        description: getReassignToastDescription(result),
      });

      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.all(tenant.id),
        });
        queryClient.invalidateQueries({
          queryKey: ["recruiter-assignment-history", tenant.id],
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message ?? "No se pudieron reasignar las vacantes",
      });
    },
  });
}
