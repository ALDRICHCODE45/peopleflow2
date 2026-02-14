"use client";
import { useState, useMemo, useCallback } from "react";
import { Spinner } from "@shadcn/spinner";
import {
  ColumnDef,
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
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
  Updater,
} from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserPlus,
  DeleteIcon,
  Copy01Icon,
  Printer,
} from "@hugeicons/core-free-icons";

import { TableBodyDataTable } from "./DataTableBody";
import { DataTablePagination } from "./DataTablePagination";
import { TableConfig } from "./TableTypes.types";
import { TableSkeleton } from "./TableSkeleton";
import { DataTableFilters } from "./DataTableFilters";
import { DataTableBulkActionsBar, BulkAction } from "./DataTableBulkActionsBar";
import { useTablePreferences } from "@/core/shared/hooks/useTablePreferences";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  config?: TableConfig<TData>;
  isLoading?: boolean;
  /** Indica si se está haciendo fetch de nuevos datos (para overlay sutil durante refetch) */
  isFetching?: boolean;
  // Callbacks para server-side (cuando config.serverSide.enabled = true)
  onPaginationChange?: (pagination: PaginationState) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onGlobalFilterChange?: (filter: string) => void;
  // Estado controlado desde el padre (server-side)
  pagination?: PaginationState;
  sorting?: SortingState;
}

/** Componente de overlay de carga sutil para refetches */
function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-md">
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  );
}

export function DataTable<TData, TValue>({
  columns,
  data,
  config = {},
  isLoading: isLoadingProp,
  isFetching: isFetchingProp,
  // Server-side callbacks
  onPaginationChange: onPaginationChangeProp,
  onSortingChange: onSortingChangeProp,
  onGlobalFilterChange: onGlobalFilterChangeProp,
  // Estado controlado (server-side)
  pagination: paginationProp,
  sorting: sortingProp,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilterState] = useState<string>("");

  // Determinar si es server-side
  const isServerSide = config.serverSide?.enabled ?? false;

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
    enableColumnVisibility: true,
    enableRowSelection: false,
    isLoading: false,
    skeletonRows: 5,
    serverSide: {
      enabled: false,
      totalCount: 0,
      pageCount: 0,
      isLoading: false,
      isFetching: false,
    },
    columnPinning: {
      enabled: false,
    },
    columnOrder: {
      enabled: false,
    },
  };

  // Combinar configuración por defecto con la proporcionada (memoizado)
  // Nota: isLoading e isFetching se calculan fuera del useMemo para evitar recálculos innecesarios
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
      skeletonRows: config.skeletonRows ?? 5,
      serverSide: { ...defaultConfig.serverSide, ...config.serverSide },
      columnPinning: {
        ...defaultConfig.columnPinning,
        ...config.columnPinning,
      },
      columnOrder: { ...defaultConfig.columnOrder, ...config.columnOrder },
    }),
    [config],
  );

  // Calcular estados de carga fuera del useMemo para evitar re-renders innecesarios del config
  const isLoading =
    isLoadingProp ?? config.isLoading ?? config.serverSide?.isLoading ?? false;
  const isFetching = isFetchingProp ?? config.serverSide?.isFetching ?? false;

  // Mostrar skeleton solo en carga inicial sin datos
  const showSkeleton = isLoading && data.length === 0;
  // Mostrar overlay sutil cuando hay datos previos y se está haciendo refetch
  const showLoadingOverlay = isFetching && !isLoading && data.length > 0;

  // Estado interno para client-side
  const [internalPagination, setInternalPagination] = useState<PaginationState>(
    {
      pageIndex: 0,
      pageSize: finalConfig.pagination.defaultPageSize || 10,
    },
  );
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);

  // Determinar persistKey para column pinning y order
  const columnPinningPersistKey = finalConfig.columnPinning?.persistKey;
  const columnOrderPersistKey = finalConfig.columnOrder?.persistKey;

  // Hook para persistir preferencias de columnas (pinning y orden)
  const {
    columnPinning,
    columnOrder: storedColumnOrder,
    columnVisibility,
    setColumnPinning,
    setColumnOrder,
    setColumnVisibility,
  } = useTablePreferences({
    persistKey: columnPinningPersistKey || columnOrderPersistKey,
    defaultPinning: finalConfig.columnPinning?.defaultPinning ?? {
      left: [],
      right: [],
    },
    defaultOrder: finalConfig.columnOrder?.defaultOrder ?? [],
  });

  // Sincronizar columnOrder con las columnas actuales
  // Si hay columnas nuevas que no están en el orden guardado, agregarlas
  const columnOrder = useMemo(() => {
    const currentColumnIds = columns
      .map((col) =>
        "accessorKey" in col ? String(col.accessorKey) : (col.id ?? ""),
      )
      .filter(Boolean);

    // Si no hay orden guardado, usar el orden de las columnas definidas
    if (storedColumnOrder.length === 0) {
      return currentColumnIds;
    }

    // Encontrar columnas que no están en el orden guardado
    const storedSet = new Set(storedColumnOrder);
    const newColumns = currentColumnIds.filter((id) => !storedSet.has(id));

    // Si no hay columnas nuevas, usar el orden guardado
    if (newColumns.length === 0) {
      return storedColumnOrder;
    }

    // Agregar columnas nuevas: "select" al principio, otras al final
    const selectColumn = newColumns.find((id) => id === "select");
    const otherNewColumns = newColumns.filter((id) => id !== "select");

    let result = [...storedColumnOrder];
    if (selectColumn) {
      result = [selectColumn, ...result];
    }
    result = [...result, ...otherNewColumns];

    return result;
  }, [columns, storedColumnOrder]);

  // Usar estado del padre si es server-side, sino usar estado interno
  const pagination =
    isServerSide && paginationProp ? paginationProp : internalPagination;
  const sorting = isServerSide && sortingProp ? sortingProp : internalSorting;

  // Wrapper para setGlobalFilter que notifica al padre en server-side
  const setGlobalFilter = (value: string) => {
    setGlobalFilterState(value);
    if (isServerSide && onGlobalFilterChangeProp) {
      onGlobalFilterChangeProp(value);
    }
  };

  // Handler para cambios de paginación
  const handlePaginationChange = (updater: Updater<PaginationState>) => {
    const newPagination =
      typeof updater === "function" ? updater(pagination) : updater;

    if (isServerSide) {
      // En server-side, notificar al padre
      onPaginationChangeProp?.(newPagination);
    } else {
      // En client-side, actualizar estado interno
      setInternalPagination(newPagination);
    }
  };

  // Handler para cambios de sorting
  const handleSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      const newSorting =
        typeof updater === "function" ? updater(sorting) : updater;

      if (isServerSide) {
        // En server-side, notificar al padre y resetear a página 0
        onSortingChangeProp?.(newSorting);
        onPaginationChangeProp?.({ ...pagination, pageIndex: 0 });
      } else {
        // En client-side, actualizar estado interno
        setInternalSorting(newSorting);
      }
    },
    [
      isServerSide,
      onSortingChangeProp,
      onPaginationChangeProp,
      pagination,
      sorting,
    ],
  );

  // Handler para cambios de column pinning
  const handleColumnPinningChange = useCallback(
    (updater: Updater<ColumnPinningState>) => {
      if (typeof updater === "function") {
        setColumnPinning((prev) => updater(prev));
      } else {
        setColumnPinning(updater);
      }
    },
    [setColumnPinning],
  );

  // Handler para cambios de column order
  const handleColumnOrderChange = useCallback(
    (updater: Updater<ColumnOrderState>) => {
      if (typeof updater === "function") {
        setColumnOrder((prev) => updater(prev));
      } else {
        setColumnOrder(updater);
      }
    },
    [setColumnOrder],
  );

  // Handler para cambios de visibilidad de columnas
  const handleColumnVisibilityChange = useCallback(
    (updater: Updater<VisibilityState>) => {
      if (typeof updater === "function") {
        setColumnVisibility((prev) => updater(prev));
      } else {
        setColumnVisibility(updater);
      }
    },
    [setColumnVisibility],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),

    // Row models condicionales: solo para client-side
    ...(isServerSide
      ? {}
      : {
          getSortedRowModel: getSortedRowModel(),
          getPaginationRowModel: getPaginationRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
        }),

    // Flags manuales para server-side
    manualPagination: isServerSide,
    manualSorting: isServerSide,
    manualFiltering: isServerSide,

    // pageCount y rowCount del servidor (solo en server-side)
    // rowCount es importante para que TanStack calcule getRowCount() correctamente
    ...(isServerSide
      ? {
          pageCount: finalConfig.serverSide?.pageCount ?? -1,
          rowCount: finalConfig.serverSide?.totalCount ?? 0,
        }
      : {}),

    // Handlers
    onSortingChange: handleSortingChange,
    enableSortingRemoval: false,
    onPaginationChange: handlePaginationChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,

    // Faceted values (siempre disponible)
    getFacetedUniqueValues: getFacetedUniqueValues(),
    enableRowSelection: finalConfig.enableRowSelection,

    // Column pinning
    enableColumnPinning: finalConfig.columnPinning?.enabled ?? false,
    onColumnPinningChange: handleColumnPinningChange,

    // Column order (drag & drop)
    onColumnOrderChange: handleColumnOrderChange,

    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      columnPinning,
      columnOrder,
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
        {showSkeleton ? (
          <TableSkeleton
            columns={columns.length}
            rows={finalConfig.skeletonRows}
          />
        ) : (
          <div className="relative">
            {showLoadingOverlay && <LoadingOverlay />}
            <TableBodyDataTable<TData, TValue>
              columns={columns}
              config={finalConfig}
              table={table}
              columnPinning={columnPinning}
              columnOrder={columnOrder}
              rowSelection={rowSelection}
              columnVisibility={columnVisibility}
            />
          </div>
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
                      label: "Duplicar",
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
                      label: "Imprimir",
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
                      label: "Eliminar",
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
