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
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";
import { useClientsForSelect } from "../../hooks/useClientsForSelect";
import {
  getCountryOptions,
  getRegionOptions,
} from "@/core/lib/filter-countries";
import type { VacancySaleType, VacancyModality } from "../../types/vacancy.types";

const SALE_TYPE_OPTIONS: { value: VacancySaleType; label: string }[] = [
  { value: "NUEVA", label: "Nueva" },
  { value: "RECOMPRA", label: "Recompra" },
];

const MODALITY_OPTIONS: { value: VacancyModality; label: string }[] = [
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "REMOTO", label: "Remoto" },
  { value: "HIBRIDO", label: "Híbrido" },
];

interface Props {
  isSheetOpen: boolean;
  onOpenChange: () => void;
  // Tipo de venta
  selectedSaleTypes: VacancySaleType[];
  onSaleTypesChange: (values: VacancySaleType[]) => void;
  // Modalidad
  selectedModalities: VacancyModality[];
  onModalitiesChange: (values: VacancyModality[]) => void;
  // Recruiter
  selectedRecruiterIds: string[];
  onRecruiterIdsChange: (ids: string[]) => void;
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
}

export function VacancySheetFilters({
  isSheetOpen,
  onOpenChange,
  selectedSaleTypes,
  onSaleTypesChange,
  selectedModalities,
  onModalitiesChange,
  selectedRecruiterIds,
  onRecruiterIdsChange,
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
}: Props) {
  const isMobile = useIsMobile();
  const sheetSide = isMobile ? "bottom" : "right";

  const { data: users = [] } = useTenantUsersQuery();
  const { data: clients = [] } = useClientsForSelect();

  const recruiterOptions = useMemo(
    () => users.map((u) => ({ value: u.id, label: u.name ?? u.email })),
    [users]
  );

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

          {/* Modalidad */}
          <FilterMultiSelect
            label="Modalidad"
            options={MODALITY_OPTIONS}
            selected={selectedModalities}
            onChange={(v) => onModalitiesChange(v as VacancyModality[])}
            placeholder="Todas las modalidades"
          />

          {/* Recruiter */}
          <FilterMultiSelect
            label="Recruiter"
            options={recruiterOptions}
            selected={selectedRecruiterIds}
            onChange={onRecruiterIdsChange}
            placeholder="Todos los recruiters"
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

          {/* Fecha tentativa de entrega */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Fecha tentativa de entrega
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
        </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
