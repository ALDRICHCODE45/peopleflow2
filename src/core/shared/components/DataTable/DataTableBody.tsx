import { ColumnDef, Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";

import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shadcn/table";

import { HugeiconsIcon } from "@hugeicons/react";

import {
  ChevronDown,
  ChevronUp,
  PackageOpen,
} from "@hugeicons/core-free-icons";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@shadcn/empty";
import { TableConfig } from "./TableTypes.types";
import { getColumnMinWidth } from "./helpers/getColumnMinWidth.helper";

interface TableBodyProps<TData, TValue> {
  table: Table<TData>;
  config: TableConfig<TData>;
  columns: ColumnDef<TData, TValue>[];
}

export const TableBodyDataTable = <TData, TValue>({
  table,
  config,
  columns,
}: TableBodyProps<TData, TValue>) => {
  return (
    <>
      <div className="rounded-lg border shadow-sm w-full min-w-0 overflow-hidden">
        <div
          className="overflow-x-auto w-full min-w-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 table-scroll-container"
          role="region"
          aria-label="Tabla con scroll horizontal"
          tabIndex={0}
        >
          <TableComponent className="w-full table-fixed" role="table">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => {
                    const size = header.getSize();
                    return (
                      <TableHead
                        key={header.id}
                        className="h-12 px-2 sm:px-6 text-left font-medium whitespace-nowrap"
                        style={{
                          width: `${size}%`,
                          minWidth: `${getColumnMinWidth(size)}px`,
                          maxWidth: `${size}%`,
                        }}
                      >
                        {header.isPlaceholder ? null : config.enableSorting &&
                          header.column.getCanSort() ? (
                          <button
                            className="flex items-center gap-2 hover:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                            onClick={header.column.getToggleSortingHandler()}
                            aria-label={`Ordenar por ${flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}`}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {{
                              asc: (
                                <HugeiconsIcon
                                  icon={ChevronUp}
                                  className="h-4 w-4"
                                />
                              ),
                              desc: (
                                <HugeiconsIcon
                                  icon={ChevronDown}
                                  className="h-4 w-4"
                                />
                              ),
                            }[header.column.getIsSorted() as string] ?? null}
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </TableHead>
                    );
                  })}
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
                      return (
                        <TableCell
                          key={cell.id}
                          className="px-2 sm:px-6 py-4 overflow-hidden whitespace-normal"
                          style={{
                            width: `${size}%`,
                            minWidth: `${getColumnMinWidth(size)}px`,
                            maxWidth: `${size}%`,
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-gray-500"
                  >
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <HugeiconsIcon icon={PackageOpen} strokeWidth={1} />
                        </EmptyMedia>
                        <EmptyTitle>{config.emptyStateMessage}</EmptyTitle>
                        <EmptyDescription>
                          Ingresa un registro para visualizarlos en este
                          apartado.
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
    </>
  );
};
