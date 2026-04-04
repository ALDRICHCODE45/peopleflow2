"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

import { showToast } from "@/core/shared/components/ShowToast";
import { vacancyQueryKeys } from "@core/shared/constants/query-keys";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";

import { bulkDeleteVacanciesAction } from "@features/vacancy/server/presentation/actions/bulkDeleteVacancies.action";
import type { BulkActionResult } from "../types/vacancy.types";

const getDeleteSummary = (result: BulkActionResult): string => {
  const deletedCount = result.succeeded.length;
  const failedCount = result.failed.length;

  if (failedCount === 0) {
    return `${deletedCount} vacante${deletedCount === 1 ? "" : "s"} eliminada${deletedCount === 1 ? "" : "s"}`;
  }

  return `${deletedCount} vacante${deletedCount === 1 ? "" : "s"} eliminada${deletedCount === 1 ? "" : "s"}. ${failedCount} no se pudieron eliminar`;
};

export function useBulkDeleteVacancies(): UseMutationResult<
  BulkActionResult,
  Error,
  string[]
> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (vacancyIds: string[]) => {
      const result = await bulkDeleteVacanciesAction({ ids: vacancyIds, vacancyIds });
      const payload = result.data ?? result.result;

      if (result.error || !payload) {
        throw new Error(result.error ?? "No se pudieron eliminar las vacantes seleccionadas");
      }

      return payload;
    },
    onSuccess: (result) => {
      const hasSucceeded = result.succeeded.length > 0;
      const hasFailed = result.failed.length > 0;
      const topFailureReasons = result.failed
        .slice(0, 2)
        .map((item) => item.reason)
        .join(" · ");

      showToast({
        type: hasSucceeded && hasFailed ? "warning" : hasFailed ? "error" : "success",
        title: hasSucceeded && hasFailed
          ? "Eliminación parcial"
          : hasFailed
            ? "No se eliminaron vacantes"
            : "Vacantes eliminadas",
        description: `${getDeleteSummary(result)}${topFailureReasons ? `. ${topFailureReasons}` : ""}`,
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
        description: error.message ?? "No se pudieron eliminar las vacantes",
      });
    },
  });
}
