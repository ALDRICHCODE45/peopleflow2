import { Table } from "@tanstack/react-table";
import { Label } from "@shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/select";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";

import { useState, useEffect } from "react";
import { TableConfig } from "./TableTypes.types";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft, ArrowRight } from "@hugeicons/core-free-icons";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  config: TableConfig<TData>;
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

  const [pageInputValue, setPageInputValue] = useState<string>(
    currentPage.toString(),
  );

  // Sincronizar el input cuando cambia la página
  useEffect(() => {
    setPageInputValue(currentPage.toString());
  }, [currentPage]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInputValue(e.target.value);
  };

  const handlePageInputBlur = () => {
    const pageNumber = parseInt(pageInputValue, 10);
    if (
      !isNaN(pageNumber) &&
      pageNumber >= 1 &&
      pageNumber <= pageCount &&
      pageNumber !== currentPage
    ) {
      table.setPageIndex(pageNumber - 1);
    } else {
      setPageInputValue(currentPage.toString());
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handlePageInputBlur();
    }
  };

  if (totalRows === 0) {
    return (
      <div
        className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full"
        role="status"
        aria-live="polite"
      >
        <div className="text-sm text-gray-400 text-center sm:text-left">
          No hay resultados para mostrar
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Información de paginación */}
        {config.pagination?.showPaginationInfo && (
          <div className="text-sm text-gray-400 text-center sm:text-left">
            Mostrando {startRow} a {endRow} de {totalRows} resultado
            {totalRows !== 1 ? "s" : ""}
          </div>
        )}

        {/* Selector de tamaño de página */}
        {config.pagination?.showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <Label htmlFor="page-size" className="text-sm">
              Filas por página:
            </Label>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger id="page-size" className="w-[80px]">
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
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Botón Primera página */}
        <Button
          size="sm"
          variant="outline"
          buttonTooltip
          buttonTooltipText="Primera página"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          aria-label="Ir a la primera página"
          className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <HugeiconsIcon icon={ArrowLeft} className="h-4 w-4" />
        </Button>

        {/* Botón Página anterior */}
        <Button
          size="sm"
          variant="outline"
          buttonTooltip
          buttonTooltipText="Página anterior"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Ir a la página anterior"
        >
          <HugeiconsIcon icon={ArrowLeft} className="h-4 w-4" />
        </Button>

        {/* Navegación a página específica */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 whitespace-nowrap">
            Página
          </span>
          <Input
            type="number"
            min={1}
            max={pageCount}
            value={pageInputValue}
            onChange={handlePageInputChange}
            onBlur={handlePageInputBlur}
            onKeyDown={handlePageInputKeyDown}
            className="w-16 h-8 text-center text-sm"
            aria-label={`Página actual, página ${currentPage} de ${pageCount}`}
          />
          <span className="text-sm text-gray-400 whitespace-nowrap">
            de {pageCount}
          </span>
        </div>

        {/* Botón Página siguiente */}
        <Button
          size="sm"
          variant="outline"
          buttonTooltip
          buttonTooltipText="Página siguiente"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Ir a la página siguiente"
        >
          <HugeiconsIcon icon={ArrowRight} className="h-4 w-4" />
        </Button>

        {/* Botón Última página */}
        <Button
          size="sm"
          variant="outline"
          buttonTooltip
          buttonTooltipText="Última página"
          onClick={() => table.setPageIndex(pageCount - 1)}
          disabled={!table.getCanNextPage()}
          aria-label="Ir a la última página"
        >
          <HugeiconsIcon icon={ArrowRight} className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
