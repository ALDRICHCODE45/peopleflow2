import { FilterMultiSelect } from "@/core/shared/components/DataTable/FilterMultiSelect";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shadcn/sheet";
import { useLeadOrigins } from "../../hooks/useCatalogs";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";

interface Props {
  isSheetOpen: boolean;
  onOpenChange: () => void;
  //Filtro por origen (multi-select).
  selectedOriginIds?: string[];
  onOriginChange?: (ids: string[]) => void;
  // Filtro por usuario asignado (multi-select)
  selectedAssignedToIds?: string[];
  onAssignedToChange?: (ids: string[]) => void;
}

export const SheetFilters = ({
  isSheetOpen,
  onOpenChange,
  onOriginChange,
  selectedOriginIds = [],
  selectedAssignedToIds = [],
  onAssignedToChange,
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
        </div>
      </SheetContent>
    </Sheet>
  );
};
