"use client";

import { memo, useMemo, useCallback } from "react";
import {
  ColumnDef,
  ColumnOrderState,
  ColumnPinningState,
  RowSelectionState,
  Table,
  flexRender,
} from "@tanstack/react-table";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shadcn/table";
import { cn } from "@lib/utils";

import { HugeiconsIcon } from "@hugeicons/react";
import { PackageOpen } from "@hugeicons/core-free-icons";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@shadcn/empty";
import { TableConfig } from "./TableTypes.types";
import { getColumnMinWidth } from "./helpers/getColumnMinWidth.helper";
import {
  calculateStickyOffsets,
  getStickyStyles,
} from "./helpers/calculateStickyOffsets.helper";
import { DataTableColumnHeader } from "./DataTableColumnHeader";

interface TableBodyProps<TData, TValue> {
  table: Table<TData>;
  config: TableConfig<TData>;
  columns: ColumnDef<TData, TValue>[];
  /** Estado de pinning para detectar cambios en memo */
  columnPinning?: ColumnPinningState;
  /** Estado de orden para detectar cambios en memo */
  columnOrder?: ColumnOrderState;
  /** Estado de seleccion para detectar cambios en memo */
  rowSelection?: RowSelectionState;
}

function TableBodyDataTableInner<TData, TValue>({
  table,
  config,
  columnPinning: columnPinningProp,
  columnOrder: columnOrderProp,
  rowSelection: rowSelectionProp,
}: TableBodyProps<TData, TValue>) {
  // Determinar si las features están habilitadas
  const enableColumnPinning = config.columnPinning?.enabled ?? false;
  const enableColumnDrag = config.columnOrder?.enabled ?? false;

  // Usar props de estado si están disponibles (para reactividad con memo)
  // Si no, obtener del estado interno de la tabla
  const columnPinningState =
    columnPinningProp ?? table.getState().columnPinning;
  // columnOrderProp y rowSelectionProp se usan implicitamente por el memo para detectar cambios
  void columnOrderProp;
  void rowSelectionProp;

  // Helper para obtener posición de pin de una columna desde el estado
  const getColumnPinPosition = useCallback(
    (columnId: string): "left" | "right" | false => {
      if (columnPinningState.left?.includes(columnId)) return "left";
      if (columnPinningState.right?.includes(columnId)) return "right";
      return false;
    },
    [columnPinningState]
  );

  // Calcular offsets para columnas sticky (memoizado)
  const stickyOffsets = useMemo(() => {
    if (!enableColumnPinning) return new Map();
    return calculateStickyOffsets(table);
  }, [table, enableColumnPinning, columnPinningState]);

  // IDs de columnas para drag & drop (solo columnas no fijadas)
  const columnIds = useMemo(() => {
    if (!enableColumnDrag) return [];
    const pinnedLeft = columnPinningState.left ?? [];
    const pinnedRight = columnPinningState.right ?? [];
    const pinnedSet = new Set([...pinnedLeft, ...pinnedRight]);

    return table
      .getAllLeafColumns()
      .filter((col) => !pinnedSet.has(col.id))
      .map((col) => col.id);
  }, [table, enableColumnDrag, columnPinningState]);

  // Sensor para drag & drop con distancia de activación
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Handler para cuando termina el drag
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = columnIds.indexOf(active.id as string);
        const newIndex = columnIds.indexOf(over.id as string);

        if (oldIndex !== -1 && newIndex !== -1) {
          const currentOrder = table.getState().columnOrder;
          const allColumnIds =
            currentOrder.length > 0
              ? currentOrder
              : table.getAllLeafColumns().map((col) => col.id);

          // Encontrar índices en el orden completo
          const activeIdx = allColumnIds.indexOf(active.id as string);
          const overIdx = allColumnIds.indexOf(over.id as string);

          if (activeIdx !== -1 && overIdx !== -1) {
            const newOrder = arrayMove(allColumnIds, activeIdx, overIdx);
            table.setColumnOrder(newOrder);
          }
        }
      }
    },
    [columnIds, table]
  );

  // Calculate total min-width from all columns to enable horizontal scroll on mobile
  const totalMinWidth = table
    .getAllColumns()
    .reduce(
      (acc, column) => acc + getColumnMinWidth(column.getSize(), column.id),
      0
    );

  // Renderizar la tabla
  const tableContent = (
    <div className="rounded-lg border shadow-sm w-full min-w-0 overflow-hidden">
      <div
        className="overflow-x-auto w-full min-w-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 table-scroll-container"
        role="region"
        aria-label="Tabla con scroll horizontal"
        tabIndex={0}
      >
        <TableComponent
          className="w-full table-fixed"
          role="table"
          style={{ minWidth: `${totalMinWidth}px` }}
        >
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b">
                <SortableContext
                  items={columnIds}
                  strategy={horizontalListSortingStrategy}
                  disabled={!enableColumnDrag}
                >
                  {headerGroup.headers.map((header) => {
                    const size = header.getSize();
                    const offset = stickyOffsets.get(header.column.id);
                    const stickyStyles = getStickyStyles(offset);
                    const isCompactColumn =
                      header.column.id === "select" ||
                      header.column.id === "actions";

                    const minWidth = getColumnMinWidth(size, header.column.id);

                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          "h-12 text-left font-medium whitespace-nowrap",
                          isCompactColumn ? "px-2" : "px-2 sm:px-6"
                        )}
                        style={{
                          width: isCompactColumn ? `${minWidth}px` : `${size}%`,
                          minWidth: `${minWidth}px`,
                          maxWidth: isCompactColumn
                            ? `${minWidth}px`
                            : `${size}%`,
                          ...stickyStyles,
                        }}
                      >
                        <DataTableColumnHeader
                          header={header}
                          column={header.column}
                          enableSorting={config.enableSorting}
                          enableColumnPinning={enableColumnPinning}
                          enableColumnDrag={enableColumnDrag}
                          pinnedPosition={getColumnPinPosition(
                            header.column.id
                          )}
                        />
                      </TableHead>
                    );
                  })}
                </SortableContext>
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={`border-b transition-colors ${
                    row.getIsSelected()
                      ? "bg-muted/50 hover:bg-muted/70 focus-within:bg-muted/70"
                      : "hover:bg-muted/30 focus-within:bg-muted/30"
                  }`}
                  data-state={row.getIsSelected() && "selected"}
                  aria-selected={row.getIsSelected()}
                  role="row"
                >
                  {row.getVisibleCells().map((cell) => {
                    const size = cell.column.getSize();
                    const offset = stickyOffsets.get(cell.column.id);
                    const stickyStyles = getStickyStyles(offset);
                    const isCompactColumn =
                      cell.column.id === "select" ||
                      cell.column.id === "actions";

                    const minWidth = getColumnMinWidth(size, cell.column.id);

                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "py-4 overflow-hidden whitespace-normal",
                          isCompactColumn ? "px-2" : "px-2 sm:px-6"
                        )}
                        style={{
                          width: isCompactColumn ? `${minWidth}px` : `${size}%`,
                          minWidth: `${minWidth}px`,
                          maxWidth: isCompactColumn
                            ? `${minWidth}px`
                            : `${size}%`,
                          ...stickyStyles,
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center text-gray-500"
                >
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <HugeiconsIcon icon={PackageOpen} strokeWidth={1} />
                      </EmptyMedia>
                      <EmptyTitle>{config.emptyStateMessage}</EmptyTitle>
                      <EmptyDescription>
                        Ingresa un registro para visualizarlos en este apartado.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </TableComponent>
      </div>
    </div>
  );

  // Si drag & drop está habilitado, envolver en DndContext
  if (enableColumnDrag) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {tableContent}
      </DndContext>
    );
  }

  return tableContent;
}

// Memoizar el componente para evitar re-renders de filas cuando cambian columnas
export const TableBodyDataTable = memo(
  TableBodyDataTableInner
) as typeof TableBodyDataTableInner;
