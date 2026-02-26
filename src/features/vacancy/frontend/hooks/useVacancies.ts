"use client";

/**
 * STUB TEMPORAL — Fase 6 (Frontend Hooks)
 * Este hook usa el patrón legacy useState/useEffect.
 * TODO: Reemplazar completamente con TanStack Query en Fase 6.
 */

import { useState, useEffect, useCallback } from "react";
import type { VacancyDTO, VacancyStatusType, CreateVacancyFormData, UpdateVacancyFormData } from "../types/vacancy.types";
import { getVacanciesAction } from "../../server/presentation/actions/getVacanciesAction.action";
import { createVacancyAction } from "../../server/presentation/actions/createVacancy.action";
import { updateVacancyAction } from "../../server/presentation/actions/updateVacancy.action";
import { deleteVacancyAction } from "../../server/presentation/actions/deleteVacancy.action";

interface UseVacanciesFilters {
  statuses?: VacancyStatusType[];
  search?: string;
}

export function useVacancies(initialFilters?: UseVacanciesFilters) {
  const [vacancies, setVacancies] = useState<VacancyDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UseVacanciesFilters>(
    initialFilters ?? {},
  );

  const loadVacancies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getVacanciesAction();
    if (result.error) {
      setError(result.error);
    } else {
      setVacancies(result.vacancies);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadVacancies();
  }, [loadVacancies]);

  const createVacancy = async (data: CreateVacancyFormData) => {
    const result = await createVacancyAction(data);
    if (!result.error) {
      await loadVacancies();
    }
    return result;
  };

  const updateVacancy = async (id: string, data: UpdateVacancyFormData) => {
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
