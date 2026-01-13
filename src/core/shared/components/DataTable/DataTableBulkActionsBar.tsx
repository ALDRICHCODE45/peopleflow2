"use client";

import { Button } from "@shadcn/button";
import { Badge } from "@shadcn/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { CancelIcon } from "@hugeicons/core-free-icons";
import { ReactNode } from "react";

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
    <div
      className="sticky bottom-0 left-0 right-0 z-10 bg-background border-t shadow-lg animate-in slide-in-from-bottom-2 duration-300"
      role="toolbar"
      aria-label={`${selectedCount} elementos seleccionados`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-medium">
            {selectedCount} Seleccionado{selectedCount !== 1 ? "s" : ""}
          </Badge>
          {onClearSelection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              aria-label="Limpiar seleccion"
            >
              <HugeiconsIcon icon={CancelIcon} className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || "outline"}
              size="sm"
              onClick={action.onClick}
              aria-label={action.label}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
