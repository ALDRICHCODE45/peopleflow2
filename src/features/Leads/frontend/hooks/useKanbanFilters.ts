"use client";

import { useMemo, useState, useCallback } from "react";
import { useModalState } from "@/core/shared/hooks";
import { useDebouncedValue } from "@/core/shared/hooks/useDebouncedValue";
import { useSectors } from "./useCatalogs";

export function useKanbanFilters() {
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebouncedValue(searchValue, 300);

  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([]);
  const debouncedSectorIds = useDebouncedValue(selectedSectorIds, 300);

  const [selectedOriginIds, setSelectedOriginIds] = useState<string[]>([]);
  const debouncedOriginIds = useDebouncedValue(selectedOriginIds, 300);

  const [selectedAssignedToIds, setSelectedAssignedToIds] = useState<string[]>(
    [],
  );
  const debouncedAssignedToIds = useDebouncedValue(selectedAssignedToIds, 300);

  const {
    openModal: openSheetFilters,
    isOpen: isSheetOpen,
    closeModal: closeSheetFilters,
  } = useModalState();

  const { data: sectors = [] } = useSectors();
  const sectorOptions = useMemo(
    () => sectors.map((s) => ({ value: s.id, label: s.name })),
    [sectors],
  );

  const handleClearFilters = useCallback(() => {
    setSearchValue("");
    setSelectedSectorIds([]);
    setSelectedOriginIds([]);
    setSelectedAssignedToIds([]);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      searchValue.length > 0 ||
      selectedSectorIds.length > 0 ||
      selectedOriginIds.length > 0 ||
      selectedAssignedToIds.length > 0,
    [searchValue, selectedSectorIds, selectedOriginIds, selectedAssignedToIds],
  );

  // Detect when filters are pending (user changed but debounce hasn't fired yet)
  // Note: Array comparison uses JSON.stringify since !== compares references, not content
  const isFiltersPending = useMemo(
    () =>
      searchValue !== debouncedSearch ||
      JSON.stringify(selectedSectorIds) !== JSON.stringify(debouncedSectorIds) ||
      JSON.stringify(selectedOriginIds) !== JSON.stringify(debouncedOriginIds) ||
      JSON.stringify(selectedAssignedToIds) !==
        JSON.stringify(debouncedAssignedToIds),
    [
      searchValue,
      debouncedSearch,
      selectedSectorIds,
      debouncedSectorIds,
      selectedOriginIds,
      debouncedOriginIds,
      selectedAssignedToIds,
      debouncedAssignedToIds,
    ],
  );

  return {
    searchValue,
    setSearchValue,
    debouncedSearch,
    selectedSectorIds,
    setSelectedSectorIds,
    debouncedSectorIds,
    selectedOriginIds,
    setSelectedOriginIds,
    debouncedOriginIds,
    selectedAssignedToIds,
    setSelectedAssignedToIds,
    debouncedAssignedToIds,
    openSheetFilters,
    isSheetOpen,
    closeSheetFilters,
    sectorOptions,
    handleClearFilters,
    hasActiveFilters,
    isFiltersPending,
  };
}

export type UseKanbanFiltersReturn = ReturnType<typeof useKanbanFilters>;
