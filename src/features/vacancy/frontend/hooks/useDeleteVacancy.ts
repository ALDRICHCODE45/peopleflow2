import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteVacancyAction } from "../../server/presentation/actions/vacancy.actions";
import { toast } from "sonner";
import { VACANCIES_QUERY_KEY } from "./useVacanciesQuery";

export function useDeleteVacancy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteVacancyAction(id);
      if (!result.success) {
        throw new Error(result.error || "Error al eliminar vacante");
      }
      return result;
    },
    onSuccess: async () => {
      toast.success("Vacante eliminada exitosamente");
      await queryClient.invalidateQueries({
        queryKey: VACANCIES_QUERY_KEY,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar vacante");
    },
  });
}
