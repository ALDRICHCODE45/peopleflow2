"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

import { showToast } from "@/core/shared/components/ShowToast";
import { vacancyQueryKeys } from "@core/shared/constants/query-keys";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";

import { bulkDuplicateVacanciesAction } from "@features/vacancy/server/presentation/actions/bulkDuplicateVacancies.action";
import type { BulkActionResult } from "../types/vacancy.types";

export function useBulkDuplicateVacancies(): UseMutationResult<
  BulkActionResult,
  Error,
  string[]
> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (vacancyIds: string[]) => {
      const result = await bulkDuplicateVacanciesAction({ ids: vacancyIds, vacancyIds });
      const payload = result.data ?? result.result;

      if (result.error || !payload) {
        throw new Error(result.error ?? "No se pudieron duplicar las vacantes seleccionadas");
      }

      return payload;
    },
    onSuccess: (result) => {
      const hasSucceeded = result.succeeded.length > 0;
      const hasFailed = result.failed.length > 0;
      const failedSummary = result.failed
        .slice(0, 2)
        .map((item) => item.reason)
        .join(" · ");

      showToast({
        type: hasSucceeded && hasFailed ? "warning" : hasFailed ? "error" : "success",
        title: hasSucceeded && hasFailed
          ? "Duplicación parcial"
          : hasFailed
            ? "No se duplicaron vacantes"
            : "Vacantes duplicadas",
        description: hasFailed
          ? `${result.succeeded.length} vacante${result.succeeded.length === 1 ? "" : "s"} duplicada${result.succeeded.length === 1 ? "" : "s"}. ${result.failed.length} no se pudieron duplicar${failedSummary ? `. ${failedSummary}` : ""}`
          : `${result.succeeded.length} vacante${result.succeeded.length === 1 ? "" : "s"} duplicada${result.succeeded.length === 1 ? "" : "s"}`,
      });

      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.all(tenant.id),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message ?? "No se pudieron duplicar las vacantes",
      });
    },
  });
}
