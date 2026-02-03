import { FilterMultiSelect } from "@/core/shared/components/DataTable/FilterMultiSelect";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shadcn/sheet";
import { Label } from "@shadcn/label";
import { DatePicker } from "@shadcn/date-picker";
import { useLeadOrigins } from "../../../hooks/useCatalogs";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";
import { LEAD_EMPLOYEE_OPTIONS } from "../../../types";

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
}

export const SheetFilters = ({
  isSheetOpen,
  onOpenChange,
  onOriginChange,
  selectedOriginIds = [],
  selectedAssignedToIds = [],
  onAssignedToChange,
  selectedEmployeesNumbers = [],
  onSelectedEmployeeNumberChange,
  createdAtFrom = "",
  createdAtTo = "",
  onDateFromChange,
  onDateToChange,
}: Props) => {
  const isMobile = useIsMobile();

  const sheetSide = isMobile ? "bottom" : "right";

  const { data: origins = [] } = useLeadOrigins();
  const { data: users = [] } = useTenantUsersQuery();

  const originOptions = origins.map((o) => ({
    value: o.id,
    label: o.name,
  }));

  const userOptions = users.map((u) => ({
    value: u.id,
    label: u.name || u.email,
  }));

  const employeesOptions = LEAD_EMPLOYEE_OPTIONS.map((u) => ({
    value: u,
    label: u,
  }));

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
            Filtra tus leads con opciones adicionales
          </SheetDescription>
        </SheetHeader>
        <div className=" space-y-4 p-3">
          <FilterMultiSelect
            label="Origen"
            options={originOptions}
            selected={selectedOriginIds}
            onChange={(ids) => onOriginChange?.(ids)}
            placeholder="Todos los origenes"
          />

          <FilterMultiSelect
            label="Usuario asignado"
            options={userOptions}
            selected={selectedAssignedToIds}
            onChange={(ids) => onAssignedToChange?.(ids)}
            placeholder="Todos los usuarios"
          />

          <FilterMultiSelect
            label="Numero de empleados"
            options={employeesOptions}
            selected={selectedEmployeesNumbers}
            onChange={(employees) =>
              onSelectedEmployeeNumberChange?.(employees)
            }
            placeholder="Todos los empleados"
          />

          {/* Filtro por fecha de creacion */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Fecha de creacion</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Desde</Label>
                <DatePicker
                  value={createdAtFrom}
                  onChange={(date) => onDateFromChange?.(date)}
                  placeholder="Desde"
                  maxDate={createdAtTo || undefined}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <DatePicker
                  value={createdAtTo}
                  onChange={(date) => onDateToChange?.(date)}
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
