"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getVacanciesQueryKey } from "./useVacanciesQuery";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { deleteVacancyAction } from "../../server/presentation/actions/deleteVacancy.action";

export function useDeleteVacancy() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteVacancyAction(id);
      if (!result.success) {
        throw new Error(result.error || "Error al eliminar vacante");
      }
      return result;
    },
    onSuccess: async () => {
      showToast({
        type: "success",
        title: "Operacion Exitosa!",
        description: "Vacante eliminada exitosamente",
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
        title: "Ha ocurrido un error",
        description: "No se pudo crear la vacante",
      });
    },
  });
}
