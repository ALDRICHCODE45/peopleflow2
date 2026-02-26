"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    onSuccess: () => {
      showToast({
        type: "success",
        title: "Vacante eliminada",
        description: "La vacante fue eliminada exitosamente",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: ["vacancies", "paginated", tenant.id],
        });
      }
    },
    onError: () => {
      showToast({
        type: "error",
        title: "Error",
        description: "No se pudo eliminar la vacante",
      });
    },
  });
}
