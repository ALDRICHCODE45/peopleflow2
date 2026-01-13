import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateVacancyAction } from "../../server/presentation/actions/vacancy.actions";
import { toast } from "sonner";
import { VACANCIES_QUERY_KEY } from "./useVacanciesQuery";
import type { VacancyStatus } from "../types/vacancy.types";
import { showToast } from "@/core/shared/components/ShowToast";

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
      await queryClient.invalidateQueries({
        queryKey: VACANCIES_QUERY_KEY,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar vacante");
    },
  });
}
