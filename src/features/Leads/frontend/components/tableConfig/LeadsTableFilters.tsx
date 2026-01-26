import { Badge } from "@shadcn/badge";
import { Card, CardContent, CardHeader } from "@shadcn/card";
import { Input } from "@shadcn/input";
import { Label } from "@shadcn/label";
import { Table } from "@tanstack/react-table";
import { Filter, Search } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { BaseFilterProps } from "@/core/shared/components/DataTable/TableTypes.types";
import { FilterHeaderActions } from "@/core/shared/components/DataTable/FilterHeaderAction";
import { FilterSelect } from "@/core/shared/components/DataTable/FilterSelect";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/core/shared/ui/shadcn/sheet";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import { Button } from "@/core/shared/ui/shadcn/button";
import { useSectors, useLeadOrigins } from "../../hooks/useCatalogs";

interface LeadsTableFilterProps extends BaseFilterProps {
  table: Table<unknown>;
  onGlobalFilterChange?: (value: string) => void;
  onAdd?: () => void;
  // Controlled props from parent (server-side filtering)
  selectedSectorId?: string;
  selectedOriginId?: string;
  onSectorChange?: (value: string | undefined) => void;
  onOriginChange?: (value: string | undefined) => void;
  onClearFilters?: () => void;
}

export const LeadsTableFilters = ({
  table,
  onGlobalFilterChange,
  addButtonIcon: AddButtonIcon,
  showAddButton,
  addButtonText = "",
  onAdd,
  // Controlled filter props
  selectedSectorId,
  selectedOriginId,
  onSectorChange,
  onOriginChange,
  onClearFilters,
}: LeadsTableFilterProps) => {
  const { data: sectors = [] } = useSectors();
  const { data: origins = [] } = useLeadOrigins();

  const [isSheetOpen, setSheetOpen] = useState<boolean>(false);

  const isMobile = useIsMobile();

  const sheetSide = isMobile ? "bottom" : "right";

  // Convert sectors and origins to filter options using IDs
  const sectorOptions = [
    { value: "todos", label: "Todos los sectores" },
    ...sectors.map((s) => ({ value: s.id, label: s.name })),
  ];

  const originOptions = [
    { value: "todos", label: "Todos los orígenes" },
    ...origins.map((o) => ({ value: o.id, label: o.name })),
  ];

  // Handler for clearing all filters
  const handleClearAllFilters = () => {
    onClearFilters?.();
  };

  return (
    <>
      <Card className="mb-6 border-0 shadow-md w-full min-w-0 overflow-hidden m-1">
        <CardHeader className="pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full min-w-0 ">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="ml-2 shrink">
              {table.getFilteredRowModel().rows.length} resultados
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto min-w-0">
            <FilterHeaderActions
              showAddButton={showAddButton}
              AddButtonIcon={AddButtonIcon}
              addButtonText={addButtonText}
              buttonTooltipText="crear lead"
              onClearFilters={handleClearAllFilters}
              onAdd={onAdd}
            />
          </div>
        </CardHeader>

        <CardContent className="pt-4 pb-3 px-4 sm:px-6 w-full min-w-0">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 w-full min-w-0">
            {/* Búsqueda global */}
            <div className="space-y-2 w-full min-w-0">
              <Label htmlFor="search" className="text-xs font-medium">
                Búsqueda
              </Label>
              <div className="relative w-full min-w-0">
                <Input
                  id="search"
                  className="w-full pl-9 min-w-0"
                  placeholder="Buscar lead..."
                  value={
                    (table.getColumn("companyName")?.getFilterValue() ??
                      "") as string
                  }
                  onChange={(e) => {
                    table
                      .getColumn("companyName")
                      ?.setFilterValue(e.target.value);
                    onGlobalFilterChange?.(e.target.value);
                  }}
                />
                <HugeiconsIcon
                  icon={Search}
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>

            {/* Filtro de sector */}
            <FilterSelect
              label="Sector"
              onValueChange={(val) => onSectorChange?.(val === "todos" ? undefined : val)}
              options={sectorOptions}
              value={selectedSectorId ?? "todos"}
            />

            {/* Sheet de filtros adicionales */}
            <div className="space-y-2 w-full min-w-0">
              <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
                <Label
                  htmlFor="categoria-filter"
                  className="text-xs font-medium"
                >
                  Más filtros
                </Label>
                <SheetTrigger asChild>
                  <Button
                    variant={"outline-primary"}
                    className="w-full min-w-0"
                  >
                    <HugeiconsIcon
                      icon={Filter}
                      className="h-5 w-5 text-primary shrink"
                    />
                    Filtros
                  </Button>
                </SheetTrigger>
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
                  <div className="mt-6 space-y-4">
                    <FilterSelect
                      label="Origen"
                      onValueChange={(val) => onOriginChange?.(val === "todos" ? undefined : val)}
                      options={originOptions}
                      value={selectedOriginId ?? "todos"}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
