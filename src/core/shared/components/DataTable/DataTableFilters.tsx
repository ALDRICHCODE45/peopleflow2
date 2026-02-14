import { Table } from "@tanstack/react-table";
import { Input } from "@shadcn/input";
import { useId, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  Search01Icon,
  CancelIcon,
  DeleteIcon,
  FileDownloadIcon,
  Tick02Icon,
  PencilEdit01Icon,
  Share01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@shadcn/button";
import { Table as TanstackTable } from "@tanstack/react-table";
import { Checkbox } from "@shadcn/checkbox";
import { TableConfig } from "./TableTypes.types";
import { ColumnVisibilitySelector } from "./ColumnVisibilitySelector";

interface DataTableFiltersProps<TData> {
  config: TableConfig<TData>;
  table: Table<TData>;
  setGlobalFilter: (value: string) => void;
}

export function DataTableFilters<TData>({
  config,
  table,
  setGlobalFilter,
}: DataTableFiltersProps<TData>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const searchColumn = config.filters?.searchColumn || "nombre";
  const searchValue = (table.getColumn(searchColumn)?.getFilterValue() ??
    "") as string;
  const selectedCount = table.getSelectedRowModel().rows.length;
  const hasSelection = selectedCount > 0;

  const handleSearchChange = (value: string) => {
    table.getColumn(searchColumn)?.setFilterValue(value);
  };

  const handleClearSearch = () => {
    table.getColumn(searchColumn)?.setFilterValue("");
  };

  const handleSelectAll = () => {
    table.toggleAllRowsSelected(true);
  };

  const handleClearSelection = () => {
    table.toggleAllRowsSelected(false);
  };

  const CustomFilterComponent = config.filters?.customFilter?.component;
  const customFilterProps = config.filters?.customFilter?.props || {};

  const CustomActionComponent =
    config.actions?.customActionComponent?.component;
  const customActionProps = config.actions?.customActionComponent?.props || {};

  if (CustomFilterComponent) {
    return (
      <CustomFilterComponent
        table={table as TanstackTable<unknown>}
        onGlobalFilterChange={setGlobalFilter}
        onExport={config.actions?.onExport}
        {...customFilterProps}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Fila principal: Search + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full min-w-0">
        {/* Lado izquierdo: Search */}
        <div className="flex items-center gap-3 w-full sm:w-auto min-w-0 flex-1">
          {config.filters?.showSearch && (
            <div className="relative flex-1 max-w-xs min-w-0">
              <Input
                id={`${id}-input`}
                ref={inputRef}
                className="w-full pl-9 pr-9 min-w-0 h-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-ring"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={config.filters.searchPlaceholder || "Search"}
                type="text"
                aria-label="Buscar en la tabla"
              />
              <HugeiconsIcon
                icon={Search01Icon}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              />
              {searchValue && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 hover:bg-transparent"
                  onClick={handleClearSearch}
                  aria-label="Limpiar busqueda"
                >
                  <HugeiconsIcon
                    icon={CancelIcon}
                    className="h-3 w-3 text-muted-foreground"
                  />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Lado derecho: Add button */}
        {CustomActionComponent ? (
          <div className="w-full sm:w-auto min-w-0 flex-shrink-0">
            <CustomActionComponent
              table={table as TanstackTable<unknown>}
              onAdd={config.actions?.onAdd}
              onExport={config.actions?.onExport}
              onRefresh={config.actions?.onRefresh}
              customActions={config.actions?.customActions}
              {...customActionProps}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-shrink-0">
            {config.actions?.showAddButton && config.actions.onAdd && (
              <Button
                variant="default"
                size="sm"
                onClick={config.actions.onAdd}
                className="gap-2"
              >
                {config.actions.addButtonIcon}
                <span>{config.actions.addButtonText || "Agregar"}</span>
              </Button>
            )}
            {config.enableColumnVisibility && (
              <ColumnVisibilitySelector
                table={table as TanstackTable<unknown>}
              />
            )}
            {config.actions?.customActions}
          </div>
        )}
      </div>

      {/* Barra de acciones bulk (aparece cuando hay seleccion) */}
      {config.enableRowSelection && hasSelection && (
        <div className="flex items-center gap-1 py-2 px-3 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-2 mr-4">
            <Checkbox
              checked={table.getIsAllRowsSelected()}
              onCheckedChange={(checked) => {
                if (checked) {
                  handleSelectAll();
                } else {
                  handleClearSelection();
                }
              }}
              aria-label="Seleccionar todas las filas"
            />
            <span className="text-sm font-medium text-primary">
              {selectedCount} Selected
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <HugeiconsIcon icon={Tick02Icon} className="h-4 w-4" />
            Select All
          </Button>

          {config.actions?.onBulkShare && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const selectedRows = table
                  .getSelectedRowModel()
                  .rows.map((row) => row.original);
                config.actions?.onBulkShare?.(selectedRows);
              }}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon icon={Share01Icon} className="h-4 w-4" />
              Share
            </Button>
          )}

          {config.actions?.onBulkEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const selectedRows = table
                  .getSelectedRowModel()
                  .rows.map((row) => row.original);
                config.actions?.onBulkEdit?.(selectedRows);
              }}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4" />
              Edit
            </Button>
          )}

          {config.actions?.onBulkDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const selectedRows = table
                  .getSelectedRowModel()
                  .rows.map((row) => row.original);
                config.actions?.onBulkDelete?.(selectedRows);
              }}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <HugeiconsIcon icon={DeleteIcon} className="h-4 w-4" />
              Delete
            </Button>
          )}

          {config.actions?.onBulkExport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const selectedRows = table
                  .getSelectedRowModel()
                  .rows.map((row) => row.original);
                config.actions?.onBulkExport?.(selectedRows);
              }}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon icon={FileDownloadIcon} className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
