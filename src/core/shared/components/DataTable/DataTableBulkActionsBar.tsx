"use client";

import { Button } from "@shadcn/button";
import { Badge } from "@shadcn/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { CancelIcon } from "@hugeicons/core-free-icons";
import { ReactNode } from "react";
import { Card } from "../../ui/shadcn/card";

export interface BulkAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
}

interface DataTableBulkActionsBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClearSelection?: () => void;
  isVisible?: boolean;
}

export function DataTableBulkActionsBar({
  selectedCount,
  actions,
  onClearSelection,
  isVisible = true,
}: DataTableBulkActionsBarProps) {
  if (!isVisible || selectedCount === 0) return null;

  return (
    <Card
      className="sticky bottom-0 left-0 right-0 py-0 mx-1 z-10 bg-background border-t shadow-sm animate-in slide-in-from-bottom-2 duration-300"
      role="toolbar"
      aria-label={`${selectedCount} seleccionados`}
      // Improved touch target size on mobile
      style={{ touchAction: "manipulation" }}
    >
      <div className="flex flex-col gap-2 px-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-start w-full sm:w-auto">
          <Badge variant="secondary" className="px-2 py-1  sm:text-sm">
            {selectedCount} Seleccionado{selectedCount !== 1 ? "s" : ""}
          </Badge>
          {onClearSelection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              aria-label="Limpiar seleccion"
              className="gap-1 px-2 py-1 sm:px-3 sm:py-2 text-base sm:text-sm"
            >
              <HugeiconsIcon
                icon={CancelIcon}
                className="h-5 w-5 sm:h-4 sm:w-4 mr-1 sm:mr-2"
              />
              <span className="hidden xs:inline">Limpiar</span>
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || "outline"}
              size="sm"
              onClick={action.onClick}
              aria-label={action.label}
              className="gap-1 px-2 py-1 sm:px-3 sm:py-2 text-base sm:text-sm"
              buttonTooltip
              buttonTooltipText={action.label}
            >
              {action.icon}
              <span className="ml-1 sm:ml-2 hidden xs:inline">
                {action.label}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
