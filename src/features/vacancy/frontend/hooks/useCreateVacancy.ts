"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateVacancyFormData } from "../types/vacancy.types";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { createVacancyAction } from "../../server/presentation/actions/createVacancy.action";
import { showToast } from "@/core/shared/components/ShowToast";
import { vacancyQueryKeys } from "@core/shared/constants/query-keys";

export function useCreateVacancy() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (data: CreateVacancyFormData) => {
      const result = await createVacancyAction(data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.vacancy;
    },
    onSuccess: () => {
      showToast({
        type: "success",
        title: "Vacante creada",
        description: "La vacante fue creada exitosamente",
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
        description: "No se pudo crear la vacante",
      });
    },
  });
}
