import { Badge } from "@shadcn/badge";
import { Card, CardContent, CardHeader } from "@shadcn/card";
import { Input } from "@shadcn/input";
import { Label } from "@shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/select";
import { Table } from "@tanstack/react-table";
import { Search } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { BaseFilterProps } from "@/core/shared/components/DataTable/TableTypes.types";
import { FilterHeaderActions } from "@/core/shared/components/DataTable/FilterHeaderAction";
import { SearchableSelect } from "@/core/shared/components/SearchableSelect";
import { DatePicker } from "@/core/shared/ui/shadcn/date-picker";
import { useClientsListQuery } from "@/features/Finanzas/Clientes/frontend/hooks/useClient";
import type { ClientDTO } from "@/features/Finanzas/Clientes/frontend/types/client.types";
import {
  InvoiceStatusLabels,
  InvoiceTypeLabels,
} from "../../types/invoice.types";
import type { InvoiceStatus, InvoiceType } from "@/core/generated/prisma/client";

interface InvoicesTableFilterProps extends BaseFilterProps {
  table: Table<unknown>;
  onGlobalFilterChange?: (value: string) => void;
  status?: InvoiceStatus;
  type?: InvoiceType;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  onStatusChange?: (value?: InvoiceStatus) => void;
  onTypeChange?: (value?: InvoiceType) => void;
  onClientChange?: (value?: string) => void;
  onDateFromChange?: (value?: string) => void;
  onDateToChange?: (value?: string) => void;
  onAdd?: () => void;
  onClearFilters?: () => void;
}

export const InvoicesTableFilters = ({
  table,
  onGlobalFilterChange,
  status,
  type,
  clientId,
  dateFrom,
  dateTo,
  onStatusChange,
  onTypeChange,
  onClientChange,
  onDateFromChange,
  onDateToChange,
  addButtonIcon: AddButtonIcon,
  showAddButton,
  addButtonText = "",
  onAdd,
  onClearFilters,
}: InvoicesTableFilterProps) => {
  const { data: clients = [] } = useClientsListQuery();

  const clientOptions = [
    { value: "all", label: "Todos los clientes" },
    ...clients.map((client: ClientDTO) => ({
      value: client.id,
      label: client.nombreComercial || client.nombre,
    })),
  ];

  const handleClearAllFilters = () => {
    onClearFilters?.();
  };

  return (
    <Card className="mb-6 border-0 shadow-md w-full min-w-0 m-1 overflow-visible">
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
            buttonTooltipText="Crear factura"
            onClearFilters={handleClearAllFilters}
            onAdd={onAdd}
            table={table}
            enableColumnVisibility
          />
        </div>
      </CardHeader>

      <CardContent className="pt-4 pb-3 px-4 sm:px-6 w-full min-w-0">
        {/* Remove overflow-hidden to allow SearchableSelect popover to display */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 w-full min-w-0">
          {/* Busqueda global */}
          <div className="space-y-2 w-full min-w-0">
            <Label htmlFor="search-invoices" className="text-xs font-medium">
              Búsqueda
            </Label>
            <div className="relative w-full min-w-0">
              <Input
                id="search-invoices"
                className="w-full pl-9 min-w-0"
                placeholder="Buscar facturas..."
                value={
                  (table.getColumn("folio")?.getFilterValue() ?? "") as string
                }
                onChange={(e) => {
                  table.getColumn("folio")?.setFilterValue(e.target.value);
                  onGlobalFilterChange?.(e.target.value);
                }}
              />
              <HugeiconsIcon
                icon={Search}
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
            </div>
          </div>

          <div className="space-y-2 w-full min-w-0 sm:col-span-1">
            <Label className="text-xs font-medium">Estado</Label>
            <Select
              value={status ?? "all"}
              onValueChange={(value) =>
                onStatusChange?.(
                  value === "all" ? undefined : (value as InvoiceStatus),
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(InvoiceStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 w-full min-w-0 sm:col-span-1">
            <Label className="text-xs font-medium">Tipo</Label>
            <Select
              value={type ?? "all"}
              onValueChange={(value) =>
                onTypeChange?.(value === "all" ? undefined : (value as InvoiceType))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(InvoiceTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 w-full min-w-0 sm:col-span-1 lg:col-span-2">
            <Label className="text-xs font-medium">Cliente</Label>
            <SearchableSelect
              options={clientOptions}
              value={clientId ?? "all"}
              placeholder="Todos los clientes"
              searchPlaceholder="Buscar cliente..."
              onChange={(value) =>
                onClientChange?.(value === "all" ? undefined : value)
              }
            />
          </div>

          <div className="space-y-2 w-full min-w-0">
            <Label htmlFor="issued-from" className="text-xs font-medium">
              Fecha desde
            </Label>
            <DatePicker
              value={dateFrom ?? ""}
              onChange={(date) => onDateFromChange?.(date || undefined)}
              placeholder="Desde"
            />
          </div>

          <div className="space-y-2 w-full min-w-0">
            <Label htmlFor="issued-to" className="text-xs font-medium">
              Fecha hasta
            </Label>
            <DatePicker
              value={dateTo ?? ""}
              onChange={(date) => onDateToChange?.(date || undefined)}
              placeholder="Hasta"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
