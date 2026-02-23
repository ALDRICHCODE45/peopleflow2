"use client";

import { memo, useMemo } from "react";
import { Checkbox } from "@shadcn/checkbox";
import { Label } from "@shadcn/label";
import {
  type LeadStatus,
  LEAD_STATUS_LABELS,
} from "@features/Leads/frontend/types";
import {
  STATUS_DOT_COLORS,
  ALL_STATUSES,
} from "../constants/leadStatusDisplay";

interface LeadStatusSelectorProps {
  selectedStatuses: LeadStatus[];
  onStatusChange: (status: LeadStatus, checked: boolean) => void;
}

export const LeadStatusSelector = memo(function LeadStatusSelector({
  selectedStatuses,
  onStatusChange,
}: LeadStatusSelectorProps) {
  const selectedSet = useMemo(
    () => new Set(selectedStatuses),
    [selectedStatuses],
  );

  return (
    <div className="mt-3 rounded-md border bg-muted/30 p-3 space-y-3">
      <p className="text-muted-foreground text-xs font-medium">
        Notificar en estos estados:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ALL_STATUSES.map((status) => {
          const isChecked = selectedSet.has(status);
          return (
            <Label
              key={status}
              className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={(checked) =>
                  onStatusChange(status, checked === true)
                }
              />
              <span
                className={`size-2 rounded-full shrink-0 ${STATUS_DOT_COLORS[status]}`}
              />
              <span className="text-sm">{LEAD_STATUS_LABELS[status]}</span>
            </Label>
          );
        })}
      </div>

      <p className="text-muted-foreground text-xs">
        {selectedStatuses.length} de {ALL_STATUSES.length} estados
        seleccionados
      </p>
    </div>
  );
});
