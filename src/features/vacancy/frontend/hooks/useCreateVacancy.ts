import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createVacancyAction } from "../../server/presentation/actions/vacancy.actions";
import { toast } from "sonner";
import { VACANCIES_QUERY_KEY } from "./useVacanciesQuery";
import type { VacancyStatus } from "../types/vacancy.types";

export interface CreateVacancyData {
  title: string;
  description: string;
  status?: VacancyStatus;
  department?: string;
  location?: string;
}

export function useCreateVacancy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVacancyData) => {
      const result = await createVacancyAction(data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.vacancy;
    },
    onSuccess: async () => {
      toast.success("Vacante creada exitosamente");
      await queryClient.invalidateQueries({
        queryKey: VACANCIES_QUERY_KEY,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear vacante");
    },
  });
}
