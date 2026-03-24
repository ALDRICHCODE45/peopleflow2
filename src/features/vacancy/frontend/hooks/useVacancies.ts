"use client";

/**
 * @deprecated Este hook NO tiene tenant scoping y usa el patrón legacy useState/useEffect.
 * NO está importado en ningún componente del proyecto.
 * Usar en su lugar:
 * - `useVacanciesQuery` (listado simple con TanStack Query + tenant scope)
 * - `usePaginatedVacanciesQuery` (listado paginado con TanStack Query + tenant scope)
 * - Mutaciones individuales: `useCreateVacancy`, `useUpdateVacancy`, `useDeleteVacancy`
 *
 * TODO: Eliminar este archivo cuando se confirme que no hay dependencias externas.
 */

import { useState, useEffect, useCallback } from "react";
import type {
  VacancyDTO,
  VacancyStatusType,
  CreateVacancyFormData,
  UpdateVacancyFormData,
  CreateVacancyResult,
  UpdateVacancyResult,
  DeleteVacancyResult,
} from "../types/vacancy.types";
import { getVacanciesAction } from "../../server/presentation/actions/getVacanciesAction.action";
import { createVacancyAction } from "../../server/presentation/actions/createVacancy.action";
import { updateVacancyAction } from "../../server/presentation/actions/updateVacancy.action";
import { deleteVacancyAction } from "../../server/presentation/actions/deleteVacancy.action";

interface UseVacanciesFilters {
  statuses?: VacancyStatusType[];
  search?: string;
}

export interface UseVacanciesReturn {
  vacancies: VacancyDTO[];
  isLoading: boolean;
  error: string | null;
  filters: UseVacanciesFilters;
  refresh: () => Promise<void>;
  createVacancy: (data: CreateVacancyFormData) => Promise<CreateVacancyResult>;
  updateVacancy: (id: string, data: UpdateVacancyFormData) => Promise<UpdateVacancyResult>;
  deleteVacancy: (id: string) => Promise<DeleteVacancyResult>;
  updateFilters: (newFilters: UseVacanciesFilters) => void;
}

/** @deprecated Use `useVacanciesQuery` or `usePaginatedVacanciesQuery` instead. */
export function useVacancies(initialFilters?: UseVacanciesFilters): UseVacanciesReturn {
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
