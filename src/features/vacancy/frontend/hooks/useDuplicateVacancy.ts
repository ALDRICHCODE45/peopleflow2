"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

import { showToast } from "@/core/shared/components/ShowToast";
import { vacancyQueryKeys } from "@core/shared/constants/query-keys";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";

import { duplicateVacancyAction } from "@features/vacancy/server/presentation/actions/duplicateVacancy.action";
import type { DuplicateVacancyResult } from "../types/vacancy.types";

export function useDuplicateVacancy(): UseMutationResult<{ id: string }, Error, string> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (vacancyId: string) => {
      const result: DuplicateVacancyResult = await duplicateVacancyAction(vacancyId);

      if (result.error || !result.data) {
        throw new Error(result.error ?? "No se pudo duplicar la vacante");
      }

      return result.data;
    },
    onSuccess: () => {
      showToast({
        type: "success",
        title: "Vacante duplicada",
        description: "La vacante se duplicó correctamente",
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
        description: error.message ?? "No se pudo duplicar la vacante",
      });
    },
  });
}
