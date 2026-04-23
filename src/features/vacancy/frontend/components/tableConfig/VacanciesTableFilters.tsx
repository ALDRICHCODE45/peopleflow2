"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@shadcn/badge";
import { Button } from "@shadcn/button";
import { Card, CardContent, CardHeader } from "@shadcn/card";
import { Input } from "@shadcn/input";
import { Label } from "@shadcn/label";
import type { Table } from "@tanstack/react-table";
import { Cancel01Icon, Filter, Search } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { BaseFilterProps } from "@/core/shared/components/DataTable/TableTypes.types";
import { FilterHeaderActions } from "@/core/shared/components/DataTable/FilterHeaderAction";
import { FilterMultiSelect } from "@/core/shared/components/DataTable/FilterMultiSelect";
import { getCountryOptions, getRegionOptions } from "@/core/lib/filter-countries";
import { useModalState } from "@/core/shared/hooks";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";
import { useClientsForSelect } from "../../hooks/useClientsForSelect";
import type {
  VacancyCurrency,
  VacancyModality,
  VacancySaleType,
  VacancySalaryType,
  VacancyServiceType,
  VacancyStatusType,
} from "../../types/vacancy.types";
import {
  VACANCY_CURRENCY_LABELS,
  VACANCY_SALARY_TYPE_LABELS,
  VACANCY_SERVICE_TYPE_LABELS,
  VACANCY_STATUS_LABELS,
} from "../../types/vacancy.types";
import { VacancySheetFilters } from "./VacancySheetFilters";
import type { DeliveryUrgencyFilter } from "./hooks/useVacanciesFilters";

type VacancyQuickPreset = "MY_VACANCIES" | "URGENT" | "THIS_WEEK";

const DELIVERY_URGENCY_LABELS: Record<DeliveryUrgencyFilter, string> = {
  OVERDUE: "Vencidas",
  DUE_3_DAYS: "Por vencer (3 días)",
  DUE_7_DAYS: "Por vencer (7 días)",
  DUE_14_DAYS: "Por vencer (14 días)",
};

interface VacanciesTableFilterProps extends BaseFilterProps {
  table: Table<unknown>;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  onAdd?: () => void;
  onClearFilters?: () => void;
  isFocusMode?: boolean;
  // Inline filters
  selectedRecruiterIds?: string[];
  onRecruiterIdsChange?: (ids: string[]) => void;
  currentUserId?: string;
  currentUserLabel?: string;
  selectedTabStatuses?: VacancyStatusType[];
  onRemoveTabStatus?: (status: VacancyStatusType) => void;
  activePreset?: VacancyQuickPreset | null;
  onPresetChange?: (preset: VacancyQuickPreset) => void;
  // Sheet filters — advanced
  selectedSaleTypes?: VacancySaleType[];
  onSaleTypesChange?: (values: VacancySaleType[]) => void;
  selectedServiceTypes?: VacancyServiceType[];
  onServiceTypesChange?: (values: VacancyServiceType[]) => void;
  selectedModalities?: VacancyModality[];
  onModalitiesChange?: (values: VacancyModality[]) => void;
  selectedCurrencies?: VacancyCurrency[];
  onCurrenciesChange?: (values: VacancyCurrency[]) => void;
  selectedSalaryTypes?: VacancySalaryType[];
  onSalaryTypesChange?: (values: VacancySalaryType[]) => void;
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
  deliveryUrgency?: DeliveryUrgencyFilter;
  onDeliveryUrgencyChange?: (value: DeliveryUrgencyFilter | undefined) => void;
  hasActiveSheetFilters?: boolean;
  activeSheetFiltersCount?: number;
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
  selectedRecruiterIds = [],
  onRecruiterIdsChange = noop,
  currentUserId = "",
  currentUserLabel = "",
  selectedTabStatuses = [],
  onRemoveTabStatus = noop,
  activePreset = null,
  onPresetChange = noop,
  selectedSaleTypes = [],
  onSaleTypesChange = noop,
  selectedServiceTypes = [],
  onServiceTypesChange = noop,
  selectedModalities = [],
  onModalitiesChange = noop,
  selectedCurrencies = [],
  onCurrenciesChange = noop,
  selectedSalaryTypes = [],
  onSalaryTypesChange = noop,
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
  deliveryUrgency = undefined,
  onDeliveryUrgencyChange = noop,
  hasActiveSheetFilters = false,
  activeSheetFiltersCount = 0,
  isFocusMode = false,
}: VacanciesTableFilterProps) => {
  const {
    openModal: openSheetFilters,
    isOpen: isOpenSheetFilters,
    closeModal: closeSheetFilters,
  } = useModalState();

  const { data: users = [] } = useTenantUsersQuery();
  const { data: clients = [] } = useClientsForSelect();

  const recruiterOptions = useMemo(
    () => users.map((u) => ({ value: u.id, label: u.name ?? u.email })),
    [users],
  );

  const clientOptions = useMemo(
    () => (clients ?? []).map((c) => ({ value: c.id, label: c.nombre })),
    [clients],
  );

  const countryOptions = useMemo(() => getCountryOptions(), []);
  const regionOptions = useMemo(
    () =>
      selectedCountryCodes.length > 0
        ? getRegionOptions(selectedCountryCodes)
        : [],
    [selectedCountryCodes],
  );

  const recruiterLabelMap = useMemo(
    () => new Map(recruiterOptions.map((option) => [option.value, option.label])),
    [recruiterOptions],
  );
  const clientLabelMap = useMemo(
    () => new Map(clientOptions.map((option) => [option.value, option.label])),
    [clientOptions],
  );
  const countryLabelMap = useMemo(
    () => new Map(countryOptions.map((option) => [option.value, option.label])),
    [countryOptions],
  );
  const regionLabelMap = useMemo(
    () => new Map(regionOptions.map((option) => [option.value, option.label])),
    [regionOptions],
  );

  const activeFilterChips = useMemo(
    () => [
      ...selectedTabStatuses.map((status) => ({
        key: `status-${status}`,
        label: `Estado: ${VACANCY_STATUS_LABELS[status]}`,
        onRemove: () => onRemoveTabStatus(status),
      })),
      ...selectedRecruiterIds.map((id) => ({
        key: `recruiter-${id}`,
        label: `Recruiter: ${
          recruiterLabelMap.get(id) ??
          (id === currentUserId && currentUserLabel ? currentUserLabel : id)
        }`,
        onRemove: () =>
          onRecruiterIdsChange(selectedRecruiterIds.filter((item) => item !== id)),
      })),
      ...selectedSaleTypes.map((value) => ({
        key: `sale-${value}`,
        label: `Venta: ${value === "NUEVA" ? "Nueva" : "Recompra"}`,
        onRemove: () =>
          onSaleTypesChange(selectedSaleTypes.filter((item) => item !== value)),
      })),
      ...selectedServiceTypes.map((value) => ({
        key: `service-${value}`,
        label: `Servicio: ${VACANCY_SERVICE_TYPE_LABELS[value]}`,
        onRemove: () =>
          onServiceTypesChange(selectedServiceTypes.filter((item) => item !== value)),
      })),
      ...selectedModalities.map((value) => ({
        key: `modality-${value}`,
        label: `Modalidad: ${value}`,
        onRemove: () =>
          onModalitiesChange(selectedModalities.filter((item) => item !== value)),
      })),
      ...selectedCurrencies.map((value) => ({
        key: `currency-${value}`,
        label: `Moneda: ${VACANCY_CURRENCY_LABELS[value]}`,
        onRemove: () =>
          onCurrenciesChange(selectedCurrencies.filter((item) => item !== value)),
      })),
      ...selectedSalaryTypes.map((value) => ({
        key: `salary-type-${value}`,
        label: `Salario: ${VACANCY_SALARY_TYPE_LABELS[value]}`,
        onRemove: () =>
          onSalaryTypesChange(selectedSalaryTypes.filter((item) => item !== value)),
      })),
      ...selectedClientIds.map((id) => ({
        key: `client-${id}`,
        label: `Cliente: ${clientLabelMap.get(id) ?? id}`,
        onRemove: () =>
          onClientIdsChange(selectedClientIds.filter((item) => item !== id)),
      })),
      ...selectedCountryCodes.map((code) => ({
        key: `country-${code}`,
        label: `País: ${countryLabelMap.get(code) ?? code}`,
        onRemove: () =>
          onCountryCodesChange(selectedCountryCodes.filter((item) => item !== code)),
      })),
      ...selectedRegionCodes.map((code) => ({
        key: `region-${code}`,
        label: `Región: ${regionLabelMap.get(code) ?? code}`,
        onRemove: () =>
          onRegionCodesChange(selectedRegionCodes.filter((item) => item !== code)),
      })),
      ...(requiresPsychometry
        ? [
            {
              key: "psychometry",
              label: "Requiere psicometría",
              onRemove: () => onRequiresPsychometryChange(undefined),
            },
          ]
        : []),
      ...(salaryMin !== undefined || salaryMax !== undefined
        ? [
            {
              key: "salary-range",
              label: `Rango salarial: ${salaryMin ?? 0} - ${salaryMax ?? "∞"}`,
              onRemove: () => {
                onSalaryMinChange(undefined);
                onSalaryMaxChange(undefined);
              },
            },
          ]
        : []),
      ...(assignedAtFrom || assignedAtTo
        ? [
            {
              key: "assigned-at",
              label: `Asignación: ${
                assignedAtFrom
                  ? format(parseISO(assignedAtFrom), "EEE yyyy/MM/dd", { locale: es })
                      .replace(".", "")
                      .toLowerCase()
                  : "-"
              } a ${
                assignedAtTo
                  ? format(parseISO(assignedAtTo), "EEE yyyy/MM/dd", { locale: es })
                      .replace(".", "")
                      .toLowerCase()
                  : "-"
              }`,
              onRemove: () => {
                onAssignedAtFromChange("");
                onAssignedAtToChange("");
              },
            },
          ]
        : []),
      ...(targetDeliveryDateFrom || targetDeliveryDateTo
        ? [
            {
              key: "delivery-range",
              label: `Entrega: ${targetDeliveryDateFrom || "-"} a ${targetDeliveryDateTo || "-"}`,
              onRemove: () => {
                onTargetDeliveryDateFromChange("");
                onTargetDeliveryDateToChange("");
              },
            },
          ]
        : []),
      ...(deliveryUrgency
        ? [
            {
              key: "delivery-urgency",
              label: `Urgencia: ${DELIVERY_URGENCY_LABELS[deliveryUrgency]}`,
              onRemove: () => onDeliveryUrgencyChange(undefined),
            },
          ]
        : []),
    ],
    [
      selectedTabStatuses,
      onRemoveTabStatus,
      selectedRecruiterIds,
      recruiterLabelMap,
      currentUserId,
      currentUserLabel,
      onRecruiterIdsChange,
      selectedSaleTypes,
      onSaleTypesChange,
      selectedServiceTypes,
      onServiceTypesChange,
      selectedModalities,
      onModalitiesChange,
      selectedCurrencies,
      onCurrenciesChange,
      selectedSalaryTypes,
      onSalaryTypesChange,
      selectedClientIds,
      clientLabelMap,
      onClientIdsChange,
      selectedCountryCodes,
      countryLabelMap,
      onCountryCodesChange,
      selectedRegionCodes,
      regionLabelMap,
      onRegionCodesChange,
      requiresPsychometry,
      onRequiresPsychometryChange,
      salaryMin,
      salaryMax,
      onSalaryMinChange,
      onSalaryMaxChange,
      assignedAtFrom,
      assignedAtTo,
      onAssignedAtFromChange,
      onAssignedAtToChange,
      targetDeliveryDateFrom,
      targetDeliveryDateTo,
      onTargetDeliveryDateFromChange,
      onTargetDeliveryDateToChange,
      deliveryUrgency,
      onDeliveryUrgencyChange,
    ],
  );

  const handleClearAllFilters = () => {
    onClearFilters?.();
    onGlobalFilterChange?.("");
  };

  const PresetButtons = (
    <div className="w-full flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant={activePreset === "MY_VACANCIES" ? "default" : "outline"}
        onClick={() => onPresetChange("MY_VACANCIES")}
      >
        Mis vacantes
      </Button>
      <Button
        type="button"
        size="sm"
        variant={activePreset === "URGENT" ? "default" : "outline"}
        onClick={() => onPresetChange("URGENT")}
      >
        Urgentes
      </Button>
      <Button
        type="button"
        size="sm"
        variant={activePreset === "THIS_WEEK" ? "default" : "outline"}
        onClick={() => onPresetChange("THIS_WEEK")}
      >
        Esta semana
      </Button>
    </div>
  );

  const ActiveChips =
    activeFilterChips.length > 0 ? (
      <div className="w-full flex flex-wrap gap-2">
        {activeFilterChips.map((chip) => (
          <Button
            key={chip.key}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={chip.onRemove}
          >
            {chip.label}
            <HugeiconsIcon icon={Cancel01Icon} className="h-3 w-3" />
          </Button>
        ))}
      </div>
    ) : null;

  // Modo foco: layout inline compacto, sin Card wrapper
  if (isFocusMode) {
    return (
      <>
        <div className="flex flex-wrap items-end gap-3 w-full min-w-0 py-2">
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Input
              id="vacancy-search-focus"
              className="w-full pl-9"
              placeholder="Buscar vacante..."
              value={globalFilter ?? ""}
              onChange={(e) => onGlobalFilterChange?.(e.target.value)}
            />
            <HugeiconsIcon
              icon={Search}
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
          </div>

          <div className="min-w-[180px] flex-1 max-w-xs">
            <FilterMultiSelect
              options={recruiterOptions}
              selected={selectedRecruiterIds}
              onChange={onRecruiterIdsChange}
              placeholder="Todos los recruiters"
            />
          </div>

          <Button
            onClick={openSheetFilters}
            variant={hasActiveSheetFilters ? "default" : "outline-primary"}
            size="sm"
            className="flex-shrink-0"
          >
            <HugeiconsIcon icon={Filter} className="h-4 w-4" />
            {hasActiveSheetFilters
              ? `Más filtros (${activeSheetFiltersCount})`
              : "Más filtros"}
          </Button>

          {PresetButtons}
          {ActiveChips}
        </div>

        <VacancySheetFilters
          isSheetOpen={isOpenSheetFilters}
          onOpenChange={closeSheetFilters}
          selectedSaleTypes={selectedSaleTypes}
          onSaleTypesChange={onSaleTypesChange}
          selectedServiceTypes={selectedServiceTypes}
          onServiceTypesChange={onServiceTypesChange}
          selectedModalities={selectedModalities}
          onModalitiesChange={onModalitiesChange}
          selectedCurrencies={selectedCurrencies}
          onCurrenciesChange={onCurrenciesChange}
          selectedSalaryTypes={selectedSalaryTypes}
          onSalaryTypesChange={onSalaryTypesChange}
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
          deliveryUrgency={deliveryUrgency}
          onDeliveryUrgencyChange={onDeliveryUrgencyChange}
        />
      </>
    );
  }

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

            <FilterMultiSelect
              label="Recruiter"
              options={recruiterOptions}
              selected={selectedRecruiterIds}
              onChange={onRecruiterIdsChange}
              placeholder="Todos los recruiters"
            />

            <div className="space-y-2 w-full min-w-0">
              <Label className="text-xs font-medium">Más filtros</Label>
              <Button
                onClick={openSheetFilters}
                variant={hasActiveSheetFilters ? "default" : "outline-primary"}
                className="w-full min-w-0"
              >
                <HugeiconsIcon icon={Filter} className="h-5 w-5 shrink" />
                {hasActiveSheetFilters
                  ? `Filtros (${activeSheetFiltersCount})`
                  : "Filtros"}
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {PresetButtons}
            {ActiveChips}
          </div>
        </CardContent>
      </Card>

      <VacancySheetFilters
        isSheetOpen={isOpenSheetFilters}
        onOpenChange={closeSheetFilters}
        selectedSaleTypes={selectedSaleTypes}
        onSaleTypesChange={onSaleTypesChange}
        selectedServiceTypes={selectedServiceTypes}
        onServiceTypesChange={onServiceTypesChange}
        selectedModalities={selectedModalities}
        onModalitiesChange={onModalitiesChange}
        selectedCurrencies={selectedCurrencies}
        onCurrenciesChange={onCurrenciesChange}
        selectedSalaryTypes={selectedSalaryTypes}
        onSalaryTypesChange={onSalaryTypesChange}
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
        deliveryUrgency={deliveryUrgency}
        onDeliveryUrgencyChange={onDeliveryUrgencyChange}
      />
    </>
  );
};
