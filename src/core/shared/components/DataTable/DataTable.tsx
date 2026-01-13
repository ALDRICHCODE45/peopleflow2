"use client";
import { useState, useMemo } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserPlus,
  DeleteIcon,
  FileDownloadIcon,
  Copy01Icon,
  Printer,
} from "@hugeicons/core-free-icons";

import { TableBodyDataTable } from "./DataTableBody";
import { DataTablePagination } from "./DataTablePagination";
import { TableConfig } from "./TableTypes.types";
import { TableSkeleton } from "./TableSkeleton";
import { DataTableFilters } from "./DataTableFilters";
import { DataTableBulkActionsBar, BulkAction } from "./DataTableBulkActionsBar";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  config?: TableConfig<TData>;
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  config = {},
  isLoading: isLoadingProp,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState<string>("");

  // Configuración por defecto
  const defaultConfig: Required<TableConfig<TData>> = {
    filters: {
      searchColumn: "nombre",
      searchPlaceholder: "Buscar...",
      showSearch: true,
    },
    actions: {
      showAddButton: true,
      addButtonText: "Agregar",
      addButtonIcon: <HugeiconsIcon icon={UserPlus} />,
      showExportButton: false,
      showRefreshButton: false,
    },
    pagination: {
      defaultPageSize: 5,
      pageSizeOptions: [5, 10, 20, 50],
      showPageSizeSelector: true,
      showPaginationInfo: true,
    },
    emptyStateMessage: "No se encontraron resultados.",
    enableSorting: true,
    enableColumnVisibility: false,
    enableRowSelection: false,
    isLoading: false,
    skeletonRows: 5,
  };

  // Combinar configuración por defecto con la proporcionada (memoizado)
  const finalConfig = useMemo(
    () => ({
      filters: { ...defaultConfig.filters, ...config.filters },
      actions: { ...defaultConfig.actions, ...config.actions },
      pagination: { ...defaultConfig.pagination, ...config.pagination },
      emptyStateMessage:
        config.emptyStateMessage || defaultConfig.emptyStateMessage,
      enableSorting: config.enableSorting ?? defaultConfig.enableSorting,
      enableColumnVisibility:
        config.enableColumnVisibility ?? defaultConfig.enableColumnVisibility,
      enableRowSelection:
        config.enableRowSelection ?? defaultConfig.enableRowSelection,
      isLoading: isLoadingProp ?? config.isLoading ?? false,
      skeletonRows: config.skeletonRows ?? 5,
    }),
    [config, isLoadingProp]
  );

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: finalConfig.pagination.defaultPageSize || 10,
  });

  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    enableRowSelection: finalConfig.enableRowSelection,
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  return (
    <div
      className="space-y-4 w-full max-w-full min-w-0 overflow-hidden"
      role="region"
      aria-label="Tabla de datos"
    >
      {/* Filtros personalizados o por defecto */}
      <div
        className="w-full min-w-0 pr-2"
        role="search"
        aria-label="Filtros de búsqueda"
      >
        <DataTableFilters
          config={finalConfig}
          setGlobalFilter={setGlobalFilter}
          table={table}
        />
      </div>

      {/* Cuerpo de la tabla*/}
      <div className="w-full min-w-0">
        {finalConfig.isLoading ? (
          <TableSkeleton
            columns={columns.length}
            rows={finalConfig.skeletonRows}
          />
        ) : (
          <TableBodyDataTable<TData, TValue>
            columns={columns}
            config={finalConfig}
            table={table}
          />
        )}
      </div>

      {/* Bulk Actions Bar (aparece en el fondo cuando hay seleccion) */}
      {finalConfig.enableRowSelection &&
        finalConfig.actions?.showBulkActions &&
        table.getSelectedRowModel().rows.length > 0 && (
          <DataTableBulkActionsBar
            selectedCount={table.getSelectedRowModel().rows.length}
            onClearSelection={() => table.toggleAllRowsSelected(false)}
            actions={[
              ...(finalConfig.actions?.onBulkExport
                ? [
                    {
                      id: "duplicate",
                      label: "Duplicate",
                      icon: (
                        <HugeiconsIcon icon={Copy01Icon} className="h-4 w-4" />
                      ),
                      onClick: () => {
                        const selectedRows = table
                          .getSelectedRowModel()
                          .rows.map((row) => row.original);
                        console.log("Duplicating:", selectedRows);
                      },
                      variant: "outline" as const,
                    },
                  ]
                : []),
              ...(finalConfig.actions?.onBulkExport
                ? [
                    {
                      id: "print",
                      label: "Print",
                      icon: (
                        <HugeiconsIcon icon={Printer} className="h-4 w-4" />
                      ),
                      onClick: () => {
                        const selectedRows = table
                          .getSelectedRowModel()
                          .rows.map((row) => row.original);
                        console.log("Printing:", selectedRows);
                      },
                      variant: "outline" as const,
                    },
                  ]
                : []),
              ...(finalConfig.actions?.onBulkDelete
                ? [
                    {
                      id: "delete",
                      label: "Delete",
                      icon: (
                        <HugeiconsIcon icon={DeleteIcon} className="h-4 w-4" />
                      ),
                      onClick: () => {
                        const selectedRows = table
                          .getSelectedRowModel()
                          .rows.map((row) => row.original);
                        finalConfig.actions?.onBulkDelete?.(selectedRows);
                      },
                      variant: "destructive" as const,
                    },
                  ]
                : []),
            ]}
          />
        )}

      {/* Pagination */}
      <nav className="w-full min-w-0" aria-label="Navegación de paginación">
        <DataTablePagination<TData> config={finalConfig} table={table} />
      </nav>
    </div>
  );
}
