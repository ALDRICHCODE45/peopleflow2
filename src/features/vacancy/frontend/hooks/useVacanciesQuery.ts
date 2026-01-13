import { useQuery } from "@tanstack/react-query";
import { getVacanciesAction } from "../../server/presentation/actions/vacancy.actions";
import type { VacancyStatus, Vacancy } from "../types/vacancy.types";

export interface VacanciesQueryFilters {
  status?: VacancyStatus;
  search?: string;
}

export const VACANCIES_QUERY_KEY = ["vacancies"] as const;

export function useVacanciesQuery(filters?: VacanciesQueryFilters) {
  return useQuery({
    queryKey: [...VACANCIES_QUERY_KEY, filters],
    queryFn: async (): Promise<Vacancy[]> => {
      const result = await getVacanciesAction(filters);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.vacancies;
    },
  });
}
