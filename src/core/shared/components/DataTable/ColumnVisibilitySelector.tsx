"use client";

import { useState, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shadcn/dropdown-menu";
import { Button } from "@shadcn/button";
import { Badge } from "@shadcn/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GridViewIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@core/lib/utils";
import { Table } from "@tanstack/react-table";

interface ColumnVisibilitySelectorProps {
  table: Table<unknown>;
}

export function ColumnVisibilitySelector({
  table,
}: ColumnVisibilitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hideableColumns = table
    .getAllColumns()
    .filter((column) => column.getCanHide());

  const hiddenCount = hideableColumns.filter(
    (col) => !col.getIsVisible(),
  ).length;

  const getColumnLabel = (column: (typeof hideableColumns)[number]): string => {
    const header = column.columnDef.header;
    if (typeof header === "string") return header;
    return column.id;
  };

  const handleToggle = useCallback(
    (columnId: string) => {
      const column = table.getColumn(columnId);
      if (column) {
        column.toggleVisibility();
      }
    },
    [table],
  );

  if (hideableColumns.length === 0) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 flex items-center gap-1"
        >
          <HugeiconsIcon icon={GridViewIcon} className="h-4 w-4" />
          <span>Columnas</span>
          {hiddenCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 shrink-0 h-5 px-1.5 text-xs"
            >
              {hiddenCount}
            </Badge>
          )}
          <HugeiconsIcon
            icon={isOpen ? ArrowUp01Icon : ArrowDown01Icon}
            className="ml-1 h-3.5 w-3.5 shrink-0 text-muted-foreground"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-64 overflow-y-auto min-w-[180px]"
      >
        {hideableColumns.map((column) => {
          const isVisible = column.getIsVisible();
          return (
            <DropdownMenuItem
              key={column.id}
              onSelect={(e) => e.preventDefault()}
              onClick={() => handleToggle(column.id)}
              className="cursor-pointer"
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-primary transition-colors",
                  isVisible
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent",
                )}
              >
                {isVisible && (
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    className="h-3 w-3"
                    strokeWidth={2}
                  />
                )}
              </span>
              <span className="text-sm truncate text-muted-foreground">
                {getColumnLabel(column)}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
