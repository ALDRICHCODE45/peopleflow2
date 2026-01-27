import { FilterSelect } from "@/core/shared/components/DataTable/FilterSelect";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shadcn/sheet";
import { useLeadOrigins } from "../../hooks/useCatalogs";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";

interface Props {
  isSheetOpen: boolean;
  onOpenChange: () => void;
  //Filtro por origen.
  selectedOriginId?: string;
  onOriginChange?: (value: string | undefined) => void;
}

export const SheetFilters = ({
  isSheetOpen,
  onOpenChange,
  onOriginChange,
  selectedOriginId,
}: Props) => {
  const isMobile = useIsMobile();

  const sheetSide = isMobile ? "bottom" : "right";

  const { data: origins = [] } = useLeadOrigins();

  const originOptions = [
    { value: "todos", label: "Todos los orígenes" },
    ...origins.map((o) => ({ value: o.id, label: o.name })),
  ];

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
        <div className="mt-6 space-y-4 p-3">
          <FilterSelect
            label="Origen"
            onValueChange={(val) =>
              onOriginChange?.(val === "todos" ? undefined : val)
            }
            options={originOptions}
            value={selectedOriginId ?? "todos"}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};
