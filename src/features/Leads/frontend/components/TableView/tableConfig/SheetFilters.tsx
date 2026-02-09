import { FilterMultiSelect } from "@/core/shared/components/DataTable/FilterMultiSelect";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shadcn/sheet";
import { Label } from "@shadcn/label";
import { Input } from "@shadcn/input";
import { DatePicker } from "@shadcn/date-picker";
import { useLeadOrigins } from "../../../hooks/useCatalogs";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";
import { LEAD_EMPLOYEE_OPTIONS } from "../../../types";
import { useMemo } from "react";
import {
  getCountryOptions,
  getRegionOptions,
} from "@/core/lib/filter-countries";

const noop = () => {};

interface Props {
  isSheetOpen: boolean;
  onOpenChange: () => void;
  //Filtro por origen (multi-select).
  selectedOriginIds?: string[];
  onOriginChange?: (ids: string[]) => void;
  // Filtro por usuario asignado (multi-select)
  selectedAssignedToIds?: string[];
  onAssignedToChange?: (ids: string[]) => void;
  //Filtro por numero de empleados
  selectedEmployeesNumbers?: string[];
  onSelectedEmployeeNumberChange?: (employees: string[]) => void;
  // Filtro por fecha de creacion
  createdAtFrom?: string;
  createdAtTo?: string;
  onDateFromChange?: (date: string) => void;
  onDateToChange?: (date: string) => void;
  // Filtro por pais (multi-select)
  selectedCountryCodes?: string[];
  onCountryChange?: (codes: string[]) => void;
  // Filtro por region (multi-select)
  selectedRegionCodes?: string[];
  onRegionChange?: (codes: string[]) => void;
  // Filtro por codigo postal
  postalCode?: string;
  onPostalCodeChange?: (value: string) => void;
}

export const SheetFilters = ({
  isSheetOpen,
  onOpenChange,
  onOriginChange = noop,
  selectedOriginIds = [],
  selectedAssignedToIds = [],
  onAssignedToChange = noop,
  selectedEmployeesNumbers = [],
  onSelectedEmployeeNumberChange = noop,
  createdAtFrom = "",
  createdAtTo = "",
  onDateFromChange = noop,
  onDateToChange = noop,
  selectedCountryCodes = [],
  onCountryChange = noop,
  selectedRegionCodes = [],
  onRegionChange = noop,
  postalCode = "",
  onPostalCodeChange = noop,
}: Props) => {
  const isMobile = useIsMobile();

  const sheetSide = isMobile ? "bottom" : "right";

  const { data: origins = [] } = useLeadOrigins();
  const { data: users = [] } = useTenantUsersQuery();

  const originOptions = useMemo(
    () => origins.map((o) => ({ value: o.id, label: o.name })),
    [origins],
  );

  const userOptions = useMemo(
    () => users.map((u) => ({ value: u.id, label: u.name || u.email })),
    [users],
  );

  const employeesOptions = useMemo(
    () => LEAD_EMPLOYEE_OPTIONS.map((u) => ({ value: u, label: u })),
    [],
  );

  const countryOptions = useMemo(() => getCountryOptions(), []);

  const hasCountrySelected = selectedCountryCodes.length > 0;

  const regionOptions = useMemo(
    () => (hasCountrySelected ? getRegionOptions(selectedCountryCodes) : []),
    [hasCountrySelected, selectedCountryCodes],
  );

  return (
    <Sheet open={isSheetOpen} onOpenChange={onOpenChange}>
      <SheetContent
        width="md"
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B] "
        side={sheetSide}
      >
        <SheetHeader>
          <SheetTitle>Filtros avanzados</SheetTitle>
          <SheetDescription>
            Filtra tus leads con opciones adicionales
          </SheetDescription>
        </SheetHeader>
        <div className=" space-y-4 p-3 mb-10">
          <FilterMultiSelect
            label="Origen"
            options={originOptions}
            selected={selectedOriginIds}
            onChange={onOriginChange}
            placeholder="Todos los origenes"
          />

          <FilterMultiSelect
            label="Usuario asignado"
            options={userOptions}
            selected={selectedAssignedToIds}
            onChange={onAssignedToChange}
            placeholder="Todos los usuarios"
          />

          <FilterMultiSelect
            label="Numero de empleados"
            options={employeesOptions}
            selected={selectedEmployeesNumbers}
            onChange={onSelectedEmployeeNumberChange}
            placeholder="Todos los empleados"
          />

          <FilterMultiSelect
            label="Pais"
            options={countryOptions}
            selected={selectedCountryCodes}
            onChange={onCountryChange}
            placeholder="Todos los paises"
          />

          <FilterMultiSelect
            label="Region"
            options={regionOptions}
            selected={selectedRegionCodes}
            onChange={onRegionChange}
            placeholder={
              hasCountrySelected
                ? "Todas las regiones"
                : "Selecciona un pais primero"
            }
            disabled={!hasCountrySelected}
          />

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Codigo Postal
            </Label>
            <Input
              value={postalCode}
              onChange={(e) => onPostalCodeChange(e.target.value)}
              placeholder="Buscar por codigo postal"
            />
          </div>

          {/* Filtro por fecha de creacion */}
          <div className="space-y-2 mt-3">
            <Label className="text-xs font-medium text-muted-foreground">
              Fecha de creacion
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Desde</Label>
                <DatePicker
                  value={createdAtFrom}
                  onChange={onDateFromChange}
                  placeholder="Desde"
                  maxDate={createdAtTo || undefined}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <DatePicker
                  value={createdAtTo}
                  onChange={onDateToChange}
                  placeholder="Hasta"
                  minDate={createdAtFrom || undefined}
                />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
