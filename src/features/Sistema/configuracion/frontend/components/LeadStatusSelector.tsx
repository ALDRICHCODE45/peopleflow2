"use client";

import { Checkbox } from "@shadcn/checkbox";
import { Label } from "@shadcn/label";
import {
  type LeadStatus,
  LEAD_STATUS_LABELS,
} from "@features/Leads/frontend/types";

const STATUS_DOT_COLORS: Record<LeadStatus, string> = {
  CONTACTO: "bg-cyan-500",
  CONTACTO_CALIDO: "bg-blue-500",
  SOCIAL_SELLING: "bg-purple-500",
  CITA_AGENDADA: "bg-yellow-500",
  CITA_ATENDIDA: "bg-orange-500",
  CITA_VALIDADA: "bg-green-500",
  POSICIONES_ASIGNADAS: "bg-emerald-500",
  STAND_BY: "bg-gray-400",
};

const ALL_STATUSES = Object.keys(LEAD_STATUS_LABELS) as LeadStatus[];

interface LeadStatusSelectorProps {
  selectedStatuses: LeadStatus[];
  onStatusChange: (status: LeadStatus, checked: boolean) => void;
}

export function LeadStatusSelector({
  selectedStatuses,
  onStatusChange,
}: LeadStatusSelectorProps) {
  return (
    <div className="mt-3 rounded-md border bg-muted/30 p-3 space-y-3">
      <p className="text-muted-foreground text-xs font-medium">
        Notificar en estos estados:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ALL_STATUSES.map((status) => {
          const isChecked = selectedStatuses.includes(status);
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
}
