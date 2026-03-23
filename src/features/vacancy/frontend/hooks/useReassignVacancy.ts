"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { vacancyQueryKeys } from "@core/shared/constants/query-keys";
import { reassignVacancyAction } from "@features/vacancy/server/presentation/actions/reassignVacancy.action";
import type { ReassignVacancyInput } from "../types/vacancy.types";

export function useReassignVacancy(): UseMutationResult<
  void,
  Error,
  ReassignVacancyInput
> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (input: ReassignVacancyInput) => {
      const result = await reassignVacancyAction(input);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: (_data, variables) => {
      showToast({
        type: "success",
        title: "Reclutador reasignado",
        description: "El reclutador de la vacante fue cambiado exitosamente",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.detail(tenant.id, variables.vacancyId),
        });
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.all(tenant.id),
        });
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.assignmentHistory(
            tenant.id,
            variables.vacancyId,
          ),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error al reasignar",
        description: error.message ?? "No se pudo reasignar el reclutador",
      });
    },
  });
}
