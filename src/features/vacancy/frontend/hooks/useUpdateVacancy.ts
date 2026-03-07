"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateVacancyFormData } from "../types/vacancy.types";
import { showToast } from "@/core/shared/components/ShowToast";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { updateVacancyAction } from "../../server/presentation/actions/updateVacancy.action";
import { vacancyQueryKeys } from "@core/shared/constants/query-keys";

export interface UpdateVacancyData {
  id: string;
  data: UpdateVacancyFormData;
}

export function useUpdateVacancy() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateVacancyData) => {
      const result = await updateVacancyAction(id, data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.vacancy;
    },
    onSuccess: () => {
      showToast({
        type: "success",
        title: "Vacante actualizada",
        description: "La vacante fue actualizada exitosamente",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.all(tenant.id),
        });
      }
    },
    onError: () => {
      showToast({
        type: "error",
        title: "Error",
        description: "No se pudo actualizar la vacante",
      });
    },
  });
}
