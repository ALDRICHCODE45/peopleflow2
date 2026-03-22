import { Badge } from "@shadcn/badge";
import { Card, CardContent, CardHeader } from "@shadcn/card";
import { Input } from "@shadcn/input";
import { Label } from "@shadcn/label";
import { Table } from "@tanstack/react-table";
import { Search } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { BaseFilterProps } from "@/core/shared/components/DataTable/TableTypes.types";
import { FilterHeaderActions } from "@/core/shared/components/DataTable/FilterHeaderAction";

interface ClientesTableFilterProps extends BaseFilterProps {
  table: Table<unknown>;
  onGlobalFilterChange?: (value: string) => void;
  onAdd?: () => void;
  onClearFilters?: () => void;
}

export const ClientesTableFilters = ({
  table,
  onGlobalFilterChange,
  addButtonIcon: AddButtonIcon,
  showAddButton,
  addButtonText = "",
  onAdd,
  onClearFilters,
}: ClientesTableFilterProps) => {
  const handleClearAllFilters = () => {
    onClearFilters?.();
  };

  return (
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
            buttonTooltipText="Crear cliente"
            onClearFilters={handleClearAllFilters}
            onAdd={onAdd}
            table={table}
            enableColumnVisibility
          />
        </div>
      </CardHeader>

      <CardContent className="pt-4 pb-3 px-4 sm:px-6 w-full min-w-0">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full min-w-0">
          {/* Búsqueda global */}
          <div className="space-y-2 w-full min-w-0">
            <Label htmlFor="search-clients" className="text-xs font-medium">
              Búsqueda
            </Label>
            <div className="relative w-full min-w-0">
              <Input
                id="search-clients"
                className="w-full pl-9 min-w-0"
                placeholder="Buscar cliente..."
                value={
                  (table.getColumn("nombre")?.getFilterValue() ?? "") as string
                }
                onChange={(e) => {
                  table.getColumn("nombre")?.setFilterValue(e.target.value);
                  onGlobalFilterChange?.(e.target.value);
                }}
              />
              <HugeiconsIcon
                icon={Search}
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
