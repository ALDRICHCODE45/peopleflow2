import { Badge } from "@shadcn/badge";
import { Card, CardContent, CardHeader } from "@shadcn/card";
import { Input } from "@shadcn/input";
import { Label } from "@shadcn/label";
import { Table } from "@tanstack/react-table";
import { Filter, Search } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
//import { FilterSelect } from "@/core/shared/components/DataTable/FilterSelect";
import { BaseFilterProps } from "@/core/shared/components/DataTable/TableTypes.types";
import { FilterHeaderActions } from "@/core/shared/components/DataTable/FilterHeaderAction";
import { useVacanciesTableFilters } from "./hooks/useVacanciesTableFilters";
import { FilterSelect } from "@/core/shared/components/DataTable/FilterSelect";
import { vacancyStatusOptions } from "./typers/vacancyStatusOptions";
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

interface VacanciesTableFilterProps extends BaseFilterProps {
  table: Table<unknown>;
  onGlobalFilterChange?: (value: string) => void;
  onAdd?: () => void;
}

export const VacanciesTableFilters = ({
  table,
  onGlobalFilterChange,
  addButtonIcon: AddButtonIcon,
  showAddButton,
  addButtonText = "",
  onAdd,
}: VacanciesTableFilterProps) => {
  const { clearFilters, handleEstadoChange, selectedEstado } =
    useVacanciesTableFilters(table);

  const [isSheetOpen, setSheetOpen] = useState<boolean>(false);

  const isMobile = useIsMobile();

  const sheetSide = isMobile ? "bottom" : "right";

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
              buttonTooltipText="crear vacante"
              onClearFilters={() => {
                clearFilters();
                onGlobalFilterChange?.("");
              }}
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
                  placeholder="Buscar vacante..."
                  value={
                    (table.getColumn("title")?.getFilterValue() ?? "") as string
                  }
                  onChange={(e) => {
                    table.getColumn("title")?.setFilterValue(e.target.value);
                    onGlobalFilterChange?.(e.target.value);
                  }}
                />
                <HugeiconsIcon
                  icon={Search}
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>

            {/* Filtro de categoría */}

            <FilterSelect
              label="Estado"
              onValueChange={handleEstadoChange}
              options={vacancyStatusOptions}
              value={selectedEstado}
            />

            <div className="space-y-2 w-full min-w-0">
              <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
                <Label
                  htmlFor="categoria-filter"
                  className="text-xs font-medium"
                >
                  Filtros
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
                    <SheetTitle>Filtros</SheetTitle>
                    <SheetDescription>
                      Filtra tus vacantes en este apartado
                    </SheetDescription>
                  </SheetHeader>
                </SheetContent>
              </Sheet>
            </div>

            {/* Filtro de rango de fechas */}
          </div>
        </CardContent>
      </Card>
    </>
  );
};
