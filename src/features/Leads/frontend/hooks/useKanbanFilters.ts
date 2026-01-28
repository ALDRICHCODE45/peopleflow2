"use client";

import { useMemo, useState, useCallback } from "react";
import { useModalState } from "@/core/shared/hooks";
import { useDebouncedValue } from "@/core/shared/hooks/useDebouncedValue";
import { useSectors } from "./useCatalogs";

export function useKanbanFilters() {
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebouncedValue(searchValue, 300);

  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([]);
  const [selectedOriginIds, setSelectedOriginIds] = useState<string[]>([]);
  const [selectedAssignedToIds, setSelectedAssignedToIds] = useState<string[]>(
    [],
  );

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

  return {
    searchValue,
    setSearchValue,
    debouncedSearch,
    selectedSectorIds,
    setSelectedSectorIds,
    selectedOriginIds,
    setSelectedOriginIds,
    selectedAssignedToIds,
    setSelectedAssignedToIds,
    openSheetFilters,
    isSheetOpen,
    closeSheetFilters,
    sectorOptions,
    handleClearFilters,
    hasActiveFilters,
  };
}

export type UseKanbanFiltersReturn = ReturnType<typeof useKanbanFilters>;
