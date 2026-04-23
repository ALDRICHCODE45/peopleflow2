"use client";

import { useMemo } from "react";
import { FilterMultiSelect } from "@/core/shared/components/DataTable/FilterMultiSelect";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shadcn/sheet";
import { Label } from "@shadcn/label";
import { Switch } from "@shadcn/switch";
import { CurrencyInput } from "@/core/shared/components/CurrencyInput";
import { DatePicker } from "@shadcn/date-picker";
import { ScrollArea } from "@shadcn/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/select";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import { useClientsForSelect } from "../../hooks/useClientsForSelect";
import {
  getCountryOptions,
  getRegionOptions,
} from "@/core/lib/filter-countries";
import type {
  VacancySaleType,
  VacancyModality,
  VacancyServiceType,
  VacancyCurrency,
  VacancySalaryType,
} from "../../types/vacancy.types";
import {
  VACANCY_SERVICE_TYPE_LABELS,
  VACANCY_CURRENCY_LABELS,
  VACANCY_SALARY_TYPE_LABELS,
} from "../../types/vacancy.types";
import type { DeliveryUrgencyFilter } from "./hooks/useVacanciesFilters";

const SALE_TYPE_OPTIONS: { value: VacancySaleType; label: string }[] = [
  { value: "NUEVA", label: "Nueva" },
  { value: "RECOMPRA", label: "Recompra" },
];

const MODALITY_OPTIONS: { value: VacancyModality; label: string }[] = [
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "REMOTO", label: "Remoto" },
  { value: "HIBRIDO", label: "Híbrido" },
];

const SERVICE_TYPE_OPTIONS: { value: VacancyServiceType; label: string }[] = [
  { value: "END_TO_END", label: VACANCY_SERVICE_TYPE_LABELS.END_TO_END },
  { value: "SOURCING", label: VACANCY_SERVICE_TYPE_LABELS.SOURCING },
];

const CURRENCY_OPTIONS: { value: VacancyCurrency; label: string }[] = [
  { value: "MXN", label: VACANCY_CURRENCY_LABELS.MXN },
  { value: "USD", label: VACANCY_CURRENCY_LABELS.USD },
];

const SALARY_TYPE_OPTIONS: { value: VacancySalaryType; label: string }[] = [
  { value: "FIXED", label: VACANCY_SALARY_TYPE_LABELS.FIXED },
  { value: "RANGE", label: VACANCY_SALARY_TYPE_LABELS.RANGE },
];

const DELIVERY_URGENCY_OPTIONS: Array<{ value: DeliveryUrgencyFilter; label: string }> = [
  { value: "OVERDUE", label: "Vencidas" },
  { value: "DUE_3_DAYS", label: "Por vencer (3 días)" },
  { value: "DUE_7_DAYS", label: "Por vencer (7 días)" },
  { value: "DUE_14_DAYS", label: "Por vencer (14 días)" },
];

interface Props {
  isSheetOpen: boolean;
  onOpenChange: () => void;
  // Tipo de venta
  selectedSaleTypes: VacancySaleType[];
  onSaleTypesChange: (values: VacancySaleType[]) => void;
  // Tipo de servicio
  selectedServiceTypes: VacancyServiceType[];
  onServiceTypesChange: (values: VacancyServiceType[]) => void;
  // Modalidad
  selectedModalities: VacancyModality[];
  onModalitiesChange: (values: VacancyModality[]) => void;
  // Moneda
  selectedCurrencies: VacancyCurrency[];
  onCurrenciesChange: (values: VacancyCurrency[]) => void;
  // Tipo de salario
  selectedSalaryTypes: VacancySalaryType[];
  onSalaryTypesChange: (values: VacancySalaryType[]) => void;
  // Cliente
  selectedClientIds: string[];
  onClientIdsChange: (ids: string[]) => void;
  // País / Región
  selectedCountryCodes: string[];
  onCountryCodesChange: (codes: string[]) => void;
  selectedRegionCodes: string[];
  onRegionCodesChange: (codes: string[]) => void;
  // Psicometría
  requiresPsychometry: boolean | undefined;
  onRequiresPsychometryChange: (value: boolean | undefined) => void;
  // Salario
  salaryMin: number | undefined;
  onSalaryMinChange: (value: number | undefined) => void;
  salaryMax: number | undefined;
  onSalaryMaxChange: (value: number | undefined) => void;
  // Fechas — assignedAt
  assignedAtFrom: string;
  onAssignedAtFromChange: (date: string) => void;
  assignedAtTo: string;
  onAssignedAtToChange: (date: string) => void;
  // Fechas — targetDeliveryDate
  targetDeliveryDateFrom: string;
  onTargetDeliveryDateFromChange: (date: string) => void;
  targetDeliveryDateTo: string;
  onTargetDeliveryDateToChange: (date: string) => void;
  // Urgencia de entrega
  deliveryUrgency: DeliveryUrgencyFilter | undefined;
  onDeliveryUrgencyChange: (value: DeliveryUrgencyFilter | undefined) => void;
}

export function VacancySheetFilters({
  isSheetOpen,
  onOpenChange,
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
  onClientIdsChange,
  selectedCountryCodes,
  onCountryCodesChange,
  selectedRegionCodes,
  onRegionCodesChange,
  requiresPsychometry,
  onRequiresPsychometryChange,
  salaryMin,
  onSalaryMinChange,
  salaryMax,
  onSalaryMaxChange,
  assignedAtFrom,
  onAssignedAtFromChange,
  assignedAtTo,
  onAssignedAtToChange,
  targetDeliveryDateFrom,
  onTargetDeliveryDateFromChange,
  targetDeliveryDateTo,
  onTargetDeliveryDateToChange,
  deliveryUrgency,
  onDeliveryUrgencyChange,
}: Props) {
  const isMobile = useIsMobile();
  const sheetSide = isMobile ? "bottom" : "right";

  const { data: clients = [] } = useClientsForSelect();

  const clientOptions = useMemo(
    () => (clients ?? []).map((c) => ({ value: c.id, label: c.nombre })),
    [clients]
  );

  const countryOptions = useMemo(() => getCountryOptions(), []);

  const hasCountrySelected = selectedCountryCodes.length > 0;

  const regionOptions = useMemo(
    () => (hasCountrySelected ? getRegionOptions(selectedCountryCodes) : []),
    [hasCountrySelected, selectedCountryCodes]
  );

  return (
    <Sheet open={isSheetOpen} onOpenChange={onOpenChange}>
      <SheetContent
        width="md"
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B]"
        side={sheetSide}
      >
        <SheetHeader>
          <SheetTitle>Filtros avanzados</SheetTitle>
          <SheetDescription>
            Filtra vacantes con opciones adicionales
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="max-h-[75vh]">
        <div className="space-y-4 p-3 mb-10">
          {/* Tipo de venta */}
          <FilterMultiSelect
            label="Tipo de venta"
            options={SALE_TYPE_OPTIONS}
            selected={selectedSaleTypes}
            onChange={(v) => onSaleTypesChange(v as VacancySaleType[])}
            placeholder="Todos los tipos"
          />

          {/* Tipo de servicio */}
          <FilterMultiSelect
            label="Tipo de servicio"
            options={SERVICE_TYPE_OPTIONS}
            selected={selectedServiceTypes}
            onChange={(v) => onServiceTypesChange(v as VacancyServiceType[])}
            placeholder="Todos los servicios"
          />

          {/* Modalidad */}
          <FilterMultiSelect
            label="Modalidad"
            options={MODALITY_OPTIONS}
            selected={selectedModalities}
            onChange={(v) => onModalitiesChange(v as VacancyModality[])}
            placeholder="Todas las modalidades"
          />

          {/* Moneda */}
          <FilterMultiSelect
            label="Moneda"
            options={CURRENCY_OPTIONS}
            selected={selectedCurrencies}
            onChange={(v) => onCurrenciesChange(v as VacancyCurrency[])}
            placeholder="Todas las monedas"
          />

          {/* Tipo de salario */}
          <FilterMultiSelect
            label="Tipo de salario"
            options={SALARY_TYPE_OPTIONS}
            selected={selectedSalaryTypes}
            onChange={(v) => onSalaryTypesChange(v as VacancySalaryType[])}
            placeholder="Todos los tipos"
          />

          {/* Cliente */}
          <FilterMultiSelect
            label="Cliente"
            options={clientOptions}
            selected={selectedClientIds}
            onChange={onClientIdsChange}
            placeholder="Todos los clientes"
          />

          {/* País */}
          <FilterMultiSelect
            label="País"
            options={countryOptions}
            selected={selectedCountryCodes}
            onChange={onCountryCodesChange}
            placeholder="Todos los países"
          />

          {/* Región */}
          <FilterMultiSelect
            label="Región"
            options={regionOptions}
            selected={selectedRegionCodes}
            onChange={onRegionCodesChange}
            placeholder={
              hasCountrySelected ? "Todas las regiones" : "Selecciona un país primero"
            }
            disabled={!hasCountrySelected}
          />

          {/* Psicometría */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Requiere psicometría
            </Label>
            <div className="flex items-center gap-3">
              <Switch
                checked={requiresPsychometry === true}
                onCheckedChange={(checked) =>
                  onRequiresPsychometryChange(checked ? true : undefined)
                }
              />
              <span className="text-sm text-muted-foreground">
                {requiresPsychometry === true ? "Sí" : "Indiferente"}
              </span>
            </div>
          </div>

          {/* Rango de salario */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Rango de salario
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Mínimo</Label>
                <CurrencyInput
                  value={salaryMin ?? ""}
                  onChange={(value) =>
                    onSalaryMinChange(
                      value ? Number(value) : undefined
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Máximo</Label>
                <CurrencyInput
                  placeholder="∞"
                  value={salaryMax ?? ""}
                  onChange={(value) =>
                    onSalaryMaxChange(
                      value ? Number(value) : undefined
                    )
                  }
                />
              </div>
            </div>
          </div>

          {/* Fecha de asignación */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Fecha de asignación
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Desde</Label>
                <DatePicker
                  value={assignedAtFrom}
                  onChange={onAssignedAtFromChange}
                  placeholder="Desde"
                  maxDate={assignedAtTo || undefined}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <DatePicker
                  value={assignedAtTo}
                  onChange={onAssignedAtToChange}
                  placeholder="Hasta"
                  minDate={assignedAtFrom || undefined}
                />
              </div>
            </div>
          </div>

          {/* Fecha máxima de entrega */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Fecha máxima de entrega
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Desde</Label>
                <DatePicker
                  value={targetDeliveryDateFrom}
                  onChange={onTargetDeliveryDateFromChange}
                  placeholder="Desde"
                  maxDate={targetDeliveryDateTo || undefined}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <DatePicker
                  value={targetDeliveryDateTo}
                  onChange={onTargetDeliveryDateToChange}
                  placeholder="Hasta"
                  minDate={targetDeliveryDateFrom || undefined}
                />
              </div>
            </div>
          </div>

          {/* Urgencia de entrega */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Urgencia de entrega
            </Label>
            <Select
              value={deliveryUrgency ?? "all"}
              onValueChange={(value) =>
                onDeliveryUrgencyChange(
                  value === "all" ? undefined : (value as DeliveryUrgencyFilter)
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {DELIVERY_URGENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
