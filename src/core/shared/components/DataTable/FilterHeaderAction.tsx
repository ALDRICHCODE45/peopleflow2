import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import { Button } from "@shadcn/button";
import { Refresh } from "@hugeicons/core-free-icons";
import { Table } from "@tanstack/react-table";
import { ColumnVisibilitySelector } from "./ColumnVisibilitySelector";

interface FilterHeaderActions {
  showAddButton?: boolean;
  AddButtonIcon?: IconSvgElement;
  addButtonText: string;
  onClearFilters: () => void;
  buttonTooltipText: string;
  onAdd?: () => void;
  onExport?: (table: Table<unknown>) => void;
  table?: Table<unknown>;
  exportFileName?: string;
  enableColumnVisibility?: boolean;
}

export const FilterHeaderActions = ({
  AddButtonIcon,
  addButtonText,
  onClearFilters,
  showAddButton = false,
  buttonTooltipText,
  onAdd,
  onExport,
  table,
  exportFileName,
  enableColumnVisibility = false,
}: FilterHeaderActions) => {
  return (
    <>
      {showAddButton && addButtonText.length > 0 && AddButtonIcon && (
        <Button
          buttonTooltip
          buttonTooltipText={buttonTooltipText}
          variant="outline-primary"
          size="lg"
          className="h-8 px-3 flex items-center gap-1"
          onClick={onAdd}
        >
          {addButtonText}
          <HugeiconsIcon icon={AddButtonIcon} className="h-4 w-4" />
        </Button>
      )}

      {showAddButton && addButtonText.length === 0 && AddButtonIcon && (
        <Button
          buttonTooltip
          buttonTooltipText={buttonTooltipText}
          variant="outline-primary"
          size="icon"
          className="h-8 px-3 flex items-center gap-1"
          onClick={onAdd}
        >
          <HugeiconsIcon icon={AddButtonIcon} className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={onClearFilters}
        className="h-8 px-3 flex items-center gap-1"
      >
        <HugeiconsIcon icon={Refresh} />
        <span>Limpiar</span>
      </Button>
      {enableColumnVisibility && table && (
        <ColumnVisibilitySelector table={table} />
      )}
    </>
  );
};
