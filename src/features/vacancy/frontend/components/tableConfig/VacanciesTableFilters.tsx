"use client";

import { useMemo } from "react";
import { Badge } from "@shadcn/badge";
import { Card, CardContent, CardHeader } from "@shadcn/card";
import { Input } from "@shadcn/input";
import { Label } from "@shadcn/label";
import { Button } from "@shadcn/button";
import type { Table } from "@tanstack/react-table";
import { Filter, Search } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { BaseFilterProps } from "@/core/shared/components/DataTable/TableTypes.types";
import { FilterHeaderActions } from "@/core/shared/components/DataTable/FilterHeaderAction";
import { FilterMultiSelect } from "@/core/shared/components/DataTable/FilterMultiSelect";
import { useModalState } from "@/core/shared/hooks";
import { VacancySheetFilters } from "./VacancySheetFilters";
import type { VacancyStatusType, VacancySaleType, VacancyModality } from "../../types/vacancy.types";

const STATUS_OPTIONS: { value: VacancyStatusType; label: string }[] = [
  { value: "QUICK_MEETING", label: "Quick Meeting" },
  { value: "HUNTING", label: "Hunting" },
  { value: "FOLLOW_UP", label: "Follow Up" },
  { value: "PRE_PLACEMENT", label: "Pre Placement" },
  { value: "PLACEMENT", label: "Placement" },
  { value: "STAND_BY", label: "Stand By" },
  { value: "CANCELADA", label: "Cancelada" },
  { value: "PERDIDA", label: "Perdida" },
];

interface VacanciesTableFilterProps extends BaseFilterProps {
  table: Table<unknown>;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  onAdd?: () => void;
  onClearFilters?: () => void;
  // Inline filters
  selectedStatuses?: VacancyStatusType[];
  onStatusesChange?: (statuses: VacancyStatusType[]) => void;
  // Sheet filters — advanced
  selectedSaleTypes?: VacancySaleType[];
  onSaleTypesChange?: (values: VacancySaleType[]) => void;
  selectedModalities?: VacancyModality[];
  onModalitiesChange?: (values: VacancyModality[]) => void;
  selectedRecruiterIds?: string[];
  onRecruiterIdsChange?: (ids: string[]) => void;
  selectedClientIds?: string[];
  onClientIdsChange?: (ids: string[]) => void;
  selectedCountryCodes?: string[];
  onCountryCodesChange?: (codes: string[]) => void;
  selectedRegionCodes?: string[];
  onRegionCodesChange?: (codes: string[]) => void;
  requiresPsychometry?: boolean;
  onRequiresPsychometryChange?: (value: boolean | undefined) => void;
  salaryMin?: number;
  onSalaryMinChange?: (value: number | undefined) => void;
  salaryMax?: number;
  onSalaryMaxChange?: (value: number | undefined) => void;
  assignedAtFrom?: string;
  onAssignedAtFromChange?: (date: string) => void;
  assignedAtTo?: string;
  onAssignedAtToChange?: (date: string) => void;
  targetDeliveryDateFrom?: string;
  onTargetDeliveryDateFromChange?: (date: string) => void;
  targetDeliveryDateTo?: string;
  onTargetDeliveryDateToChange?: (date: string) => void;
  hasActiveSheetFilters?: boolean;
}

const noop = () => {};

export const VacanciesTableFilters = ({
  table,
  globalFilter,
  onGlobalFilterChange,
  addButtonIcon: AddButtonIcon,
  showAddButton,
  addButtonText = "",
  onAdd,
  onClearFilters,
  selectedStatuses = [],
  onStatusesChange = noop,
  selectedSaleTypes = [],
  onSaleTypesChange = noop,
  selectedModalities = [],
  onModalitiesChange = noop,
  selectedRecruiterIds = [],
  onRecruiterIdsChange = noop,
  selectedClientIds = [],
  onClientIdsChange = noop,
  selectedCountryCodes = [],
  onCountryCodesChange = noop,
  selectedRegionCodes = [],
  onRegionCodesChange = noop,
  requiresPsychometry = undefined,
  onRequiresPsychometryChange = noop,
  salaryMin = undefined,
  onSalaryMinChange = noop,
  salaryMax = undefined,
  onSalaryMaxChange = noop,
  assignedAtFrom = "",
  onAssignedAtFromChange = noop,
  assignedAtTo = "",
  onAssignedAtToChange = noop,
  targetDeliveryDateFrom = "",
  onTargetDeliveryDateFromChange = noop,
  targetDeliveryDateTo = "",
  onTargetDeliveryDateToChange = noop,
  hasActiveSheetFilters = false,
}: VacanciesTableFilterProps) => {
  const {
    openModal: openSheetFilters,
    isOpen: isOpenSheetFilters,
    closeModal: closeSheetFilters,
  } = useModalState();

  const statusOptions = useMemo(() => STATUS_OPTIONS, []);

  const handleClearAllFilters = () => {
    onClearFilters?.();
    onGlobalFilterChange?.("");
  };

  return (
    <>
      <Card className="mb-6 border-0 shadow-md w-full min-w-0 overflow-hidden m-1">
        <CardHeader className="pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="ml-2 shrink">
              {table.getRowCount()} resultados
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto min-w-0">
            <FilterHeaderActions
              showAddButton={showAddButton}
              AddButtonIcon={AddButtonIcon}
              addButtonText={addButtonText}
              buttonTooltipText="Crear vacante"
              onClearFilters={handleClearAllFilters}
              onAdd={onAdd}
              table={table}
              enableColumnVisibility
            />
          </div>
        </CardHeader>

        <CardContent className="pt-4 pb-3 px-4 sm:px-6 w-full min-w-0">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 w-full min-w-0">
            {/* Búsqueda global */}
            <div className="space-y-2 w-full min-w-0">
              <Label htmlFor="vacancy-search" className="text-xs font-medium">
                Búsqueda
              </Label>
              <div className="relative w-full min-w-0">
                <Input
                  id="vacancy-search"
                  className="w-full pl-9 min-w-0"
                  placeholder="Buscar vacante..."
                  value={globalFilter ?? ""}
                  onChange={(e) => onGlobalFilterChange?.(e.target.value)}
                />
                <HugeiconsIcon
                  icon={Search}
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>

            {/* Estado */}
            <FilterMultiSelect
              label="Estado"
              options={statusOptions}
              selected={selectedStatuses}
              onChange={(v) => onStatusesChange?.(v as VacancyStatusType[])}
              placeholder="Todos los estados"
            />

            {/* Botón filtros avanzados */}
            <div className="space-y-2 w-full min-w-0">
              <Label className="text-xs font-medium">Más filtros</Label>
              <Button
                onClick={openSheetFilters}
                variant={hasActiveSheetFilters ? "default" : "outline-primary"}
                className="w-full min-w-0"
              >
                <HugeiconsIcon
                  icon={Filter}
                  className="h-5 w-5 shrink"
                />
                Filtros
                {hasActiveSheetFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                    •
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <VacancySheetFilters
        isSheetOpen={isOpenSheetFilters}
        onOpenChange={closeSheetFilters}
        selectedSaleTypes={selectedSaleTypes}
        onSaleTypesChange={onSaleTypesChange}
        selectedModalities={selectedModalities}
        onModalitiesChange={onModalitiesChange}
        selectedRecruiterIds={selectedRecruiterIds}
        onRecruiterIdsChange={onRecruiterIdsChange}
        selectedClientIds={selectedClientIds}
        onClientIdsChange={onClientIdsChange}
        selectedCountryCodes={selectedCountryCodes}
        onCountryCodesChange={onCountryCodesChange}
        selectedRegionCodes={selectedRegionCodes}
        onRegionCodesChange={onRegionCodesChange}
        requiresPsychometry={requiresPsychometry}
        onRequiresPsychometryChange={onRequiresPsychometryChange}
        salaryMin={salaryMin}
        onSalaryMinChange={onSalaryMinChange}
        salaryMax={salaryMax}
        onSalaryMaxChange={onSalaryMaxChange}
        assignedAtFrom={assignedAtFrom}
        onAssignedAtFromChange={onAssignedAtFromChange}
        assignedAtTo={assignedAtTo}
        onAssignedAtToChange={onAssignedAtToChange}
        targetDeliveryDateFrom={targetDeliveryDateFrom}
        onTargetDeliveryDateFromChange={onTargetDeliveryDateFromChange}
        targetDeliveryDateTo={targetDeliveryDateTo}
        onTargetDeliveryDateToChange={onTargetDeliveryDateToChange}
      />
    </>
  );
};
