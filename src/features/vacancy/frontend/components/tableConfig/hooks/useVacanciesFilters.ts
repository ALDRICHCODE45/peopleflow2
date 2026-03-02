"use client";

import { useCallback, useState } from "react";
import type { VacancyStatusType, VacancySaleType, VacancyModality } from "../../../types/vacancy.types";

export interface VacanciesFiltersState {
  statuses: VacancyStatusType[];
  saleTypes: VacancySaleType[];
  modalities: VacancyModality[];
  recruiterIds: string[];
  clientIds: string[];
  countryCodes: string[];
  regionCodes: string[];
  requiresPsychometry: boolean | undefined;
  salaryMin: number | undefined;
  salaryMax: number | undefined;
  assignedAtFrom: string;
  assignedAtTo: string;
  targetDeliveryDateFrom: string;
  targetDeliveryDateTo: string;
}

const INITIAL_FILTERS: VacanciesFiltersState = {
  statuses: [],
  saleTypes: [],
  modalities: [],
  recruiterIds: [],
  clientIds: [],
  countryCodes: [],
  regionCodes: [],
  requiresPsychometry: undefined,
  salaryMin: undefined,
  salaryMax: undefined,
  assignedAtFrom: "",
  assignedAtTo: "",
  targetDeliveryDateFrom: "",
  targetDeliveryDateTo: "",
};

export function useVacanciesFilters() {
  const [filters, setFilters] = useState<VacanciesFiltersState>(INITIAL_FILTERS);

  const setStatuses = useCallback((statuses: VacancyStatusType[]) => {
    setFilters((prev) => ({ ...prev, statuses }));
  }, []);

  const setSaleTypes = useCallback((saleTypes: VacancySaleType[]) => {
    setFilters((prev) => ({ ...prev, saleTypes }));
  }, []);

  const setModalities = useCallback((modalities: VacancyModality[]) => {
    setFilters((prev) => ({ ...prev, modalities }));
  }, []);

  const setRecruiterIds = useCallback((recruiterIds: string[]) => {
    setFilters((prev) => ({ ...prev, recruiterIds }));
  }, []);

  const setClientIds = useCallback((clientIds: string[]) => {
    setFilters((prev) => ({ ...prev, clientIds }));
  }, []);

  const setCountryCodes = useCallback((countryCodes: string[]) => {
    setFilters((prev) => ({ ...prev, countryCodes, regionCodes: [] }));
  }, []);

  const setRegionCodes = useCallback((regionCodes: string[]) => {
    setFilters((prev) => ({ ...prev, regionCodes }));
  }, []);

  const setRequiresPsychometry = useCallback((value: boolean | undefined) => {
    setFilters((prev) => ({ ...prev, requiresPsychometry: value }));
  }, []);

  const setSalaryMin = useCallback((salaryMin: number | undefined) => {
    setFilters((prev) => ({ ...prev, salaryMin }));
  }, []);

  const setSalaryMax = useCallback((salaryMax: number | undefined) => {
    setFilters((prev) => ({ ...prev, salaryMax }));
  }, []);

  const setAssignedAtFrom = useCallback((assignedAtFrom: string) => {
    setFilters((prev) => ({ ...prev, assignedAtFrom }));
  }, []);

  const setAssignedAtTo = useCallback((assignedAtTo: string) => {
    setFilters((prev) => ({ ...prev, assignedAtTo }));
  }, []);

  const setTargetDeliveryDateFrom = useCallback((targetDeliveryDateFrom: string) => {
    setFilters((prev) => ({ ...prev, targetDeliveryDateFrom }));
  }, []);

  const setTargetDeliveryDateTo = useCallback((targetDeliveryDateTo: string) => {
    setFilters((prev) => ({ ...prev, targetDeliveryDateTo }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  /** Returns true if any advanced filter (outside of statuses+search) is active */
  const hasActiveFilters = (
    filters.saleTypes.length > 0 ||
    filters.modalities.length > 0 ||
    filters.recruiterIds.length > 0 ||
    filters.clientIds.length > 0 ||
    filters.countryCodes.length > 0 ||
    filters.regionCodes.length > 0 ||
    filters.requiresPsychometry !== undefined ||
    filters.salaryMin !== undefined ||
    filters.salaryMax !== undefined ||
    !!filters.assignedAtFrom ||
    !!filters.assignedAtTo ||
    !!filters.targetDeliveryDateFrom ||
    !!filters.targetDeliveryDateTo
  );

  return {
    filters,
    hasActiveFilters,
    setStatuses,
    setSaleTypes,
    setModalities,
    setRecruiterIds,
    setClientIds,
    setCountryCodes,
    setRegionCodes,
    setRequiresPsychometry,
    setSalaryMin,
    setSalaryMax,
    setAssignedAtFrom,
    setAssignedAtTo,
    setTargetDeliveryDateFrom,
    setTargetDeliveryDateTo,
    clearFilters,
  };
}
