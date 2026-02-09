"use client";

import { memo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Filter, Search } from "@hugeicons/core-free-icons";
import { Button } from "@/core/shared/ui/shadcn/button";
import { Input } from "@shadcn/input";
import { Label } from "@shadcn/label";
import { FilterMultiSelect } from "@/core/shared/components/DataTable/FilterMultiSelect";
import { SheetFilters } from "../TableView/tableConfig/SheetFilters";
import type { UseKanbanFiltersReturn } from "../../hooks/useKanbanFilters";

type KanbanFiltersProps = UseKanbanFiltersReturn;

export const KanbanFilters = memo(function KanbanFilters({
  searchValue,
  setSearchValue,
  selectedSectorIds,
  setSelectedSectorIds,
  selectedOriginIds,
  setSelectedOriginIds,
  selectedAssignedToIds,
  setSelectedAssignedToIds,
  selectedEmployeeCounts,
  setSelectedEmployeeCounts,
  selectedCountryCodes,
  handleCountryChange,
  selectedRegionCodes,
  setSelectedRegionCodes,
  postalCode,
  setPostalCode,
  createdAtFrom,
  setCreatedAtFrom,
  createdAtTo,
  setCreatedAtTo,
  openSheetFilters,
  isSheetOpen,
  closeSheetFilters,
  sectorOptions,
  handleClearFilters,
  hasActiveFilters,
}: KanbanFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* Busqueda */}
      <div className="space-y-2 min-w-0 w-56">
        <Label htmlFor="kanban-search" className="text-xs font-medium">
          Busqueda
        </Label>
        <div className="relative w-full min-w-0">
          <Input
            id="kanban-search"
            className="w-full pl-9 min-w-0"
            placeholder="Buscar lead..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <HugeiconsIcon
            icon={Search}
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
        </div>
      </div>

      {/* Sector multi-select */}
      <div className="w-56">
        <FilterMultiSelect
          label="Sector"
          options={sectorOptions}
          selected={selectedSectorIds}
          onChange={setSelectedSectorIds}
          placeholder="Todos los sectores"
        />
      </div>

      {/* Mas filtros (origin + assigned user) */}
      <div className="space-y-2 min-w-0">
        <Label className="text-xs font-medium">Mas filtros</Label>
        <Button
          onClick={openSheetFilters}
          variant="outline-primary"
          className="w-full min-w-0"
        >
          <HugeiconsIcon
            icon={Filter}
            className="h-5 w-5 text-primary shrink"
          />
          Filtros
        </Button>
        <SheetFilters
          isSheetOpen={isSheetOpen}
          onOpenChange={closeSheetFilters}
          selectedOriginIds={selectedOriginIds}
          onOriginChange={setSelectedOriginIds}
          selectedAssignedToIds={selectedAssignedToIds}
          onAssignedToChange={setSelectedAssignedToIds}
          selectedEmployeesNumbers={selectedEmployeeCounts}
          onSelectedEmployeeNumberChange={setSelectedEmployeeCounts}
          selectedCountryCodes={selectedCountryCodes}
          onCountryChange={handleCountryChange}
          selectedRegionCodes={selectedRegionCodes}
          onRegionChange={setSelectedRegionCodes}
          postalCode={postalCode}
          onPostalCodeChange={setPostalCode}
          createdAtFrom={createdAtFrom}
          createdAtTo={createdAtTo}
          onDateFromChange={setCreatedAtFrom}
          onDateToChange={setCreatedAtTo}
        />
      </div>

      {/* Limpiar filtros */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );
});
