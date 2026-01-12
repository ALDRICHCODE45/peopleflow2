import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import { Button } from "@shadcn/button";
import { Refresh } from "@hugeicons/core-free-icons";
import { Table } from "@tanstack/react-table";

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
}: FilterHeaderActions) => {
  return (
    <>
      {showAddButton && (
        <Button
          buttonTooltip
          buttonTooltipText={buttonTooltipText}
          variant="default"
          size="icon"
          className="h-8 px-3 flex items-center gap-1"
          onClick={onAdd}
        >
          {AddButtonIcon && (
            <HugeiconsIcon icon={AddButtonIcon} className="h-4 w-4" />
          )}
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
      {table && <Button>Exportar</Button>}
    </>
  );
};
