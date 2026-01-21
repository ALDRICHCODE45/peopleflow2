"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getVacanciesQueryKey } from "./useVacanciesQuery";
import type { VacancyStatus } from "../types/vacancy.types";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { createVacancyAction } from "../../server/presentation/actions/createVacancy.action";
import { showToast } from "@/core/shared/components/ShowToast";

export interface CreateVacancyData {
  title: string;
  description: string;
  status?: VacancyStatus;
  department?: string;
  location?: string;
}

export function useCreateVacancy() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (data: CreateVacancyData) => {
      const result = await createVacancyAction(data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.vacancy;
    },
    onSuccess: async () => {
      showToast({
        type: "success",
        title: "Operacion Exitosa!",
        description: "Vacante creada exitosamente",
      });

      if (tenant?.id) {
        await queryClient.invalidateQueries({
          queryKey: getVacanciesQueryKey(tenant.id),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Ah ocurrido un error",
        description: "Error al crear la vacante",
      });
    },
  });
}
