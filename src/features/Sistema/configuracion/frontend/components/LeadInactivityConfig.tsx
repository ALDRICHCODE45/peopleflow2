"use client";

import { Checkbox } from "@shadcn/checkbox";
import { Label } from "@shadcn/label";
import { Input } from "@shadcn/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@shadcn/select";
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

interface LeadInactivityConfigProps {
  selectedStatuses: LeadStatus[];
  onStatusChange: (status: LeadStatus, checked: boolean) => void;
  timeValue: number;
  onTimeValueChange: (value: number) => void;
  timeUnit: "horas" | "dias";
  onTimeUnitChange: (unit: "horas" | "dias") => void;
}

export function LeadInactivityConfig({
  selectedStatuses,
  onStatusChange,
  timeValue,
  onTimeValueChange,
  timeUnit,
  onTimeUnitChange,
}: LeadInactivityConfigProps) {
  const unitLabel = timeUnit === "horas" ? "horas" : "días";

  return (
    <div className="mt-3 rounded-md border bg-muted/30 p-3 space-y-4">
      {/* Sección 1: Selector de estados */}
      <div className="space-y-3">
        <p className="text-muted-foreground text-xs font-medium">
          Aplicar en estos estados:
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

      {/* Sección 2: Tiempo de inactividad */}
      <div className="space-y-3">
        <p className="text-muted-foreground text-xs font-medium">
          Tiempo de inactividad
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Input
            type="number"
            min={1}
            value={timeValue}
            onChange={(e) => {
              const val = Number.parseInt(e.target.value, 10);
              if (!Number.isNaN(val) && val > 0) onTimeValueChange(val);
            }}
            className="w-24"
          />
          <Select value={timeUnit} onValueChange={(v) => onTimeUnitChange(v as "horas" | "dias")}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="horas">Horas</SelectItem>
              <SelectItem value="dias">Días</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-muted-foreground text-xs">
          Notificar después de {timeValue} {unitLabel} sin actividad
        </p>
      </div>
    </div>
  );
}
