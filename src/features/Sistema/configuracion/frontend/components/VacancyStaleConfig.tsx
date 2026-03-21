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
import type { VacancyStatusType } from "@features/vacancy/frontend/types/vacancy.types";
import { VACANCY_STATUS_LABELS } from "@features/vacancy/frontend/types/vacancy.types";
import {
  VACANCY_STATUS_DOT_COLORS,
  ACTIVE_VACANCY_STATUSES,
} from "../constants/vacancyStatusDisplay";

interface VacancyStaleConfigProps {
  selectedStatuses: VacancyStatusType[];
  onStatusChange: (status: VacancyStatusType, checked: boolean) => void;
  timeValue: number;
  onTimeValueChange: (value: number) => void;
  timeUnit: "horas" | "dias";
  onTimeUnitChange: (unit: "horas" | "dias") => void;
  repeatValue: number;
  onRepeatValueChange: (value: number) => void;
  repeatUnit: "horas" | "dias";
  onRepeatUnitChange: (unit: "horas" | "dias") => void;
}

export function VacancyStaleConfig({
  selectedStatuses,
  onStatusChange,
  timeValue,
  onTimeValueChange,
  timeUnit,
  onTimeUnitChange,
  repeatValue,
  onRepeatValueChange,
  repeatUnit,
  onRepeatUnitChange,
}: VacancyStaleConfigProps) {
  const timeUnitLabel = timeUnit === "horas" ? "horas" : "días";
  const repeatUnitLabel = repeatUnit === "horas" ? "horas" : "días";

  const selectedSet = new Set(selectedStatuses);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseInt(e.target.value, 10);
    if (!Number.isNaN(val) && val > 0) onTimeValueChange(val);
  };

  const handleRepeatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseInt(e.target.value, 10);
    if (!Number.isNaN(val) && val > 0) onRepeatValueChange(val);
  };

  return (
    <div className="mt-3 rounded-md border bg-muted/30 p-3 space-y-4">
      {/* Section 1: Status selector */}
      <div className="space-y-3">
        <p className="text-muted-foreground text-xs font-medium">
          Monitorear en estos estados:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ACTIVE_VACANCY_STATUSES.map((status) => {
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
                  className={`size-2 rounded-full shrink-0 ${VACANCY_STATUS_DOT_COLORS[status]}`}
                />
                <span className="text-sm">
                  {VACANCY_STATUS_LABELS[status]}
                </span>
              </Label>
            );
          })}
        </div>

        <p className="text-muted-foreground text-xs">
          {selectedStatuses.length} de {ACTIVE_VACANCY_STATUSES.length} estados
          seleccionados
        </p>
      </div>

      {/* Section 2: Stale threshold */}
      <div className="space-y-3">
        <p className="text-muted-foreground text-xs font-medium">
          Tiempo sin actividad
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Input
            type="number"
            min={1}
            value={timeValue}
            onChange={handleTimeChange}
            className="w-24"
          />
          <Select
            value={timeUnit}
            onValueChange={(v) => onTimeUnitChange(v as "horas" | "dias")}
          >
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
          Notificar cuando una vacante permanezca {timeValue} {timeUnitLabel}{" "}
          sin actividad
        </p>
      </div>

      {/* Section 3: Repeat interval */}
      <div className="space-y-3">
        <p className="text-muted-foreground text-xs font-medium">
          Periodicidad de recordatorio
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Input
            type="number"
            min={1}
            value={repeatValue}
            onChange={handleRepeatChange}
            className="w-24"
          />
          <Select
            value={repeatUnit}
            onValueChange={(v) => onRepeatUnitChange(v as "horas" | "dias")}
          >
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
          Repetir el recordatorio cada {repeatValue} {repeatUnitLabel}
        </p>
      </div>
    </div>
  );
}
