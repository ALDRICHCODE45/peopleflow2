"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getVacanciesQueryKey } from "./useVacanciesQuery";
import type { VacancyStatus } from "../types/vacancy.types";
import { showToast } from "@/core/shared/components/ShowToast";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { updateVacancyAction } from "../../server/presentation/actions/updateVacancy.action";

export interface UpdateVacancyData {
  id: string;
  title?: string;
  description?: string;
  status?: VacancyStatus;
  department?: string | null;
  location?: string | null;
}

export function useUpdateVacancy() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateVacancyData) => {
      const result = await updateVacancyAction(id, data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.vacancy;
    },
    onSuccess: async () => {
      showToast({
        title: "Operacion Exitosa!",
        description: "Vacante actualizada correctamente",
        type: "success",
      });
      if (tenant?.id) {
        await queryClient.invalidateQueries({
          queryKey: getVacanciesQueryKey(tenant.id),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        title: "Ah ocurrido un error",
        description: "La vacante no se pudo actualizar",
        type: "error",
      });
    },
  });
}
