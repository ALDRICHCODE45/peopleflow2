"use client";

import { useCallback, useState } from "react";
import type {
  VacancySaleType,
  VacancyModality,
  VacancyServiceType,
  VacancyCurrency,
  VacancySalaryType,
} from "../../../types/vacancy.types";

export type DeliveryUrgencyFilter =
  | "OVERDUE"
  | "DUE_3_DAYS"
  | "DUE_7_DAYS"
  | "DUE_14_DAYS";

export interface VacanciesFiltersState {
  saleTypes: VacancySaleType[];
  serviceTypes: VacancyServiceType[];
  modalities: VacancyModality[];
  currencies: VacancyCurrency[];
  salaryTypes: VacancySalaryType[];
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
  deliveryUrgency: DeliveryUrgencyFilter | undefined;
}

const INITIAL_FILTERS: VacanciesFiltersState = {
  saleTypes: [],
  serviceTypes: [],
  modalities: [],
  currencies: [],
  salaryTypes: [],
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
  deliveryUrgency: undefined,
};

export function useVacanciesFilters() {
  const [filters, setFilters] = useState<VacanciesFiltersState>(INITIAL_FILTERS);

  const setSaleTypes = useCallback((saleTypes: VacancySaleType[]) => {
    setFilters((prev) => ({ ...prev, saleTypes }));
  }, []);

  const setServiceTypes = useCallback((serviceTypes: VacancyServiceType[]) => {
    setFilters((prev) => ({ ...prev, serviceTypes }));
  }, []);

  const setModalities = useCallback((modalities: VacancyModality[]) => {
    setFilters((prev) => ({ ...prev, modalities }));
  }, []);

  const setCurrencies = useCallback((currencies: VacancyCurrency[]) => {
    setFilters((prev) => ({ ...prev, currencies }));
  }, []);

  const setSalaryTypes = useCallback((salaryTypes: VacancySalaryType[]) => {
    setFilters((prev) => ({ ...prev, salaryTypes }));
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

  const setDeliveryUrgency = useCallback(
    (deliveryUrgency: DeliveryUrgencyFilter | undefined) => {
      setFilters((prev) => ({ ...prev, deliveryUrgency }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  /** Returns true if any sheet-level advanced filter is active */
  const hasActiveFilters = (
    filters.saleTypes.length > 0 ||
    filters.serviceTypes.length > 0 ||
    filters.modalities.length > 0 ||
    filters.currencies.length > 0 ||
    filters.salaryTypes.length > 0 ||
    filters.clientIds.length > 0 ||
    filters.countryCodes.length > 0 ||
    filters.regionCodes.length > 0 ||
    filters.requiresPsychometry !== undefined ||
    filters.salaryMin !== undefined ||
    filters.salaryMax !== undefined ||
    !!filters.assignedAtFrom ||
    !!filters.assignedAtTo ||
    !!filters.targetDeliveryDateFrom ||
    !!filters.targetDeliveryDateTo ||
    filters.deliveryUrgency !== undefined
  );

  const activeSheetFiltersCount =
    filters.saleTypes.length +
    filters.serviceTypes.length +
    filters.modalities.length +
    filters.currencies.length +
    filters.salaryTypes.length +
    filters.clientIds.length +
    filters.countryCodes.length +
    filters.regionCodes.length +
    (filters.requiresPsychometry !== undefined ? 1 : 0) +
    (filters.salaryMin !== undefined || filters.salaryMax !== undefined ? 1 : 0) +
    (filters.assignedAtFrom || filters.assignedAtTo ? 1 : 0) +
    (filters.targetDeliveryDateFrom || filters.targetDeliveryDateTo ? 1 : 0) +
    (filters.deliveryUrgency !== undefined ? 1 : 0);

  return {
    filters,
    hasActiveFilters,
    activeSheetFiltersCount,
    setSaleTypes,
    setServiceTypes,
    setModalities,
    setCurrencies,
    setSalaryTypes,
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
    setDeliveryUrgency,
    clearFilters,
  };
}
