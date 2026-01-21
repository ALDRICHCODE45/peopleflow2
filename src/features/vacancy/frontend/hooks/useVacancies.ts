"use client";

import { useState, useEffect, useCallback } from "react";
import type { Vacancy, VacancyStatus } from "../types/vacancy.types";
import { getVacanciesAction } from "../../server/presentation/actions/getVacanciesAction.action";
import { createVacancyAction } from "../../server/presentation/actions/createVacancy.action";
import { updateVacancyAction } from "../../server/presentation/actions/updateVacancy.action";
import { deleteVacancyAction } from "../../server/presentation/actions/deleteVacancy.action";

interface UseVacanciesFilters {
  status?: VacancyStatus;
  search?: string;
}

/**
 * Hook para gestionar vacantes del tenant activo
 */
export function useVacancies(initialFilters?: UseVacanciesFilters) {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UseVacanciesFilters>(
    initialFilters || {},
  );

  const loadVacancies = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getVacanciesAction(filters);

    if (result.error) {
      setError(result.error);
    } else {
      setVacancies(result.vacancies);
    }

    setIsLoading(false);
  }, [filters]);

  useEffect(() => {
    loadVacancies();
  }, [loadVacancies]);

  const createVacancy = async (data: {
    title: string;
    description: string;
    status?: VacancyStatus;
    department?: string;
    location?: string;
  }) => {
    const result = await createVacancyAction(data);
    if (!result.error) {
      await loadVacancies();
    }
    return result;
  };

  const updateVacancy = async (
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: VacancyStatus;
      department?: string | null;
      location?: string | null;
    },
  ) => {
    const result = await updateVacancyAction(id, data);
    if (!result.error) {
      await loadVacancies();
    }
    return result;
  };

  const deleteVacancy = async (id: string) => {
    const result = await deleteVacancyAction(id);
    if (result.success) {
      await loadVacancies();
    }
    return result;
  };

  const updateFilters = (newFilters: UseVacanciesFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return {
    vacancies,
    isLoading,
    error,
    filters,
    refresh: loadVacancies,
    createVacancy,
    updateVacancy,
    deleteVacancy,
    updateFilters,
  };
}
