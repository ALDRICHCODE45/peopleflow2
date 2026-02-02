"use client";

import { memo, useCallback } from "react";
import { Column, Header, flexRender } from "@tanstack/react-table";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChevronDown,
  ChevronUp,
  MoreVerticalIcon,
  ArrowBigLeft,
  ArrowBigRight,
  PinOff,
  DragDropVerticalIcon,
  Pin02Icon,
} from "@hugeicons/core-free-icons";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shadcn/dropdown-menu";
import { cn } from "@lib/utils";

type PinPosition = "left" | "right" | false;

interface DataTableColumnHeaderProps<TData, TValue> {
  header: Header<TData, TValue>;
  column: Column<TData, TValue>;
  enableSorting?: boolean;
  enableColumnPinning?: boolean;
  enableColumnDrag?: boolean;
  /** Estado de pinning de esta columna (para detectar cambios en memo) */
  pinnedPosition?: PinPosition;
}

function DataTableColumnHeaderInner<TData, TValue>({
  header,
  column,
  enableSorting = true,
  enableColumnPinning = false,
  enableColumnDrag = false,
  pinnedPosition,
}: DataTableColumnHeaderProps<TData, TValue>) {
  // Usar pinnedPosition prop si está disponible (para reactividad con memo)
  // Si no, obtener del estado interno de la columna
  const currentPinPosition = pinnedPosition ?? column.getIsPinned();
  const isPinnedLeft = currentPinPosition === "left";
  const isPinnedRight = currentPinPosition === "right";
  const isPinned = isPinnedLeft || isPinnedRight;
  const canSort = enableSorting && column.getCanSort();

  // DnD setup - solo si está habilitado y la columna no está fijada
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    disabled: !enableColumnDrag || isPinned,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Handlers para pinning
  const handlePinLeft = useCallback(() => {
    column.pin("left");
  }, [column]);

  const handlePinRight = useCallback(() => {
    column.pin("right");
  }, [column]);

  const handleUnpin = useCallback(() => {
    column.pin(false);
  }, [column]);

  // Handler para sorting
  const handleSort = useCallback(() => {
    if (canSort) {
      column.toggleSorting();
    }
  }, [canSort, column]);

  // Si el header es placeholder, no renderizar nada
  if (header.isPlaceholder) {
    return null;
  }

  const headerContent = flexRender(
    column.columnDef.header,
    header.getContext()
  );
  const sortDirection = column.getIsSorted();

  // Columnas especiales (select, actions) - solo renderizar el contenido sin drag/dropdown
  // Estas columnas típicamente tienen header como función (componente) y no texto
  const isSpecialColumn = column.id === "select" || column.id === "actions";

  if (isSpecialColumn) {
    return <div className="flex items-center">{headerContent}</div>;
  }

  // Contenido base del header
  const baseContent = (
    <div className="flex items-center gap-1">
      {/* Drag handle - solo si está habilitado y no está fijado */}
      {enableColumnDrag && !isPinned && (
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          aria-label="Arrastrar columna"
        >
          <HugeiconsIcon icon={DragDropVerticalIcon} className="h-3 w-3" />
        </span>
      )}

      {/* Ícono de pin si está fijado */}
      {isPinned && (
        <span
          className="text-primary"
          aria-label={
            isPinnedLeft ? "Fijado a la izquierda" : "Fijado a la derecha"
          }
        >
          <HugeiconsIcon icon={Pin02Icon} className="size-4" />
        </span>
      )}

      {/* Contenido del header con sorting si está habilitado */}
      {canSort ? (
        <button
          className="flex items-center gap-1 hover:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          onClick={handleSort}
          aria-label={`Ordenar por ${headerContent}`}
        >
          {headerContent}
          {sortDirection === "asc" && (
            <HugeiconsIcon icon={ChevronUp} className="h-4 w-4" />
          )}
          {sortDirection === "desc" && (
            <HugeiconsIcon icon={ChevronDown} className="h-4 w-4" />
          )}
        </button>
      ) : (
        <span>{headerContent}</span>
      )}
    </div>
  );

  // Si no hay pinning habilitado, solo mostrar el contenido base
  if (!enableColumnPinning) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center justify-between gap-2"
      >
        {baseContent}
      </div>
    );
  }

  // Con pinning habilitado, agregar dropdown menu
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between gap-2"
    >
      {baseContent}

      {/* Dropdown menu para opciones de columna */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "p-0.5 rounded hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Opciones de columna"
          >
            <HugeiconsIcon icon={MoreVerticalIcon} className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          {!isPinnedLeft && (
            <DropdownMenuItem onClick={handlePinLeft}>
              <HugeiconsIcon icon={Pin02Icon} className="h-4 w-4 mr-2" />
              Izquierda
            </DropdownMenuItem>
          )}
          {!isPinnedRight && (
            <DropdownMenuItem onClick={handlePinRight}>
              <HugeiconsIcon icon={Pin02Icon} className="h-4 w-4 mr-2" />
              Derecha
            </DropdownMenuItem>
          )}
          {isPinned && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleUnpin}>
                <HugeiconsIcon icon={PinOff} className="h-4 w-4 mr-2" />
                Desfijar columna
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Memoizar para evitar re-renders innecesarios
// La prop pinnedPosition asegura que el memo detecte cambios de pinning
export const DataTableColumnHeader = memo(
  DataTableColumnHeaderInner
) as typeof DataTableColumnHeaderInner;
