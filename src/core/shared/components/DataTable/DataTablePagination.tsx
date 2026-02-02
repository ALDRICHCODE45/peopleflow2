import { Table } from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/select";
import { Button } from "@shadcn/button";

import { useMemo } from "react";
import { TableConfig } from "./TableTypes.types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  config: TableConfig<TData>;
}

function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5,
): (number | "ellipsis")[] {
  if (totalPages <= maxVisible + 2) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];
  const halfVisible = Math.floor(maxVisible / 2);

  pages.push(1);

  let start = Math.max(2, currentPage - halfVisible);
  let end = Math.min(totalPages - 1, currentPage + halfVisible);

  if (currentPage <= halfVisible + 1) {
    end = Math.min(maxVisible, totalPages - 1);
  }

  if (currentPage >= totalPages - halfVisible) {
    start = Math.max(2, totalPages - maxVisible + 1);
  }

  if (start > 2) {
    pages.push("ellipsis");
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages - 1) {
    pages.push("ellipsis");
  }

  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

export const DataTablePagination = <TData,>({
  config,
  table,
}: DataTablePaginationProps<TData>) => {
  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalRows = table.getRowCount();
  const pageSize = table.getState().pagination.pageSize;
  const startRow =
    totalRows === 0 ? 0 : table.getState().pagination.pageIndex * pageSize + 1;
  const endRow = Math.min(
    table.getState().pagination.pageIndex * pageSize + pageSize,
    totalRows,
  );

  const pageNumbers = useMemo(
    () => generatePageNumbers(currentPage, pageCount, 3),
    [currentPage, pageCount],
  );

  if (totalRows === 0) {
    return (
      <div
        className="flex items-center justify-center py-4"
        role="status"
        aria-live="polite"
      >
        <span className="text-sm text-muted-foreground">
          No hay resultados para mostrar
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full py-2">
      {/* Lado izquierdo: Mostrar X de Y registros */}
      <div className="flex items-center gap-2">
        {config.pagination?.showPageSizeSelector && (
          <>
            <span className="text-sm text-muted-foreground">Mostrar</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="w-17.5 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(config.pagination.pageSizeOptions || [5, 10, 20, 50]).map(
                  (size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </>
        )}
        {config.pagination?.showPaginationInfo && (
          <span className="text-sm text-muted-foreground ml-2">
            de {totalRows} registros
          </span>
        )}
      </div>

      {/* Centro: Botones de pagina numerados */}
      <div className="flex items-center gap-1">
        {/* Primera pagina */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          aria-label="Primera pagina"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4 -ml-2" />
        </Button>

        {/* Pagina anterior */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Pagina anterior"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
        </Button>

        {/* Numeros de pagina */}
        {pageNumbers.map((page, index) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-muted-foreground"
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} className="h-4 w-4" />
            </span>
          ) : (
            <Button
              key={page}
              size="icon"
              variant={currentPage === page ? "default" : "ghost"}
              className="h-8 w-8"
              onClick={() => table.setPageIndex(page - 1)}
              aria-label={`Ir a pagina ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </Button>
          ),
        )}

        {/* Pagina siguiente */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Pagina siguiente"
        >
          <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
        </Button>

        {/* Ultima pagina */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => table.setPageIndex(pageCount - 1)}
          disabled={!table.getCanNextPage()}
          aria-label="Ultima pagina"
        >
          <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
          <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4 -ml-2" />
        </Button>
      </div>

      {/* Lado derecho: Selector de página */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Página</span>
        <Select
          value={currentPage.toString()}
          onValueChange={(value) => table.setPageIndex(Number(value) - 1)}
        >
          <SelectTrigger className="w-20 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="h-55">
            {Array.from({ length: Math.min(pageCount, 100) }, (_, i) => (
              <SelectItem key={i + 1} value={(i + 1).toString()}>
                {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">de {pageCount}</span>
      </div>
    </div>
  );
};
