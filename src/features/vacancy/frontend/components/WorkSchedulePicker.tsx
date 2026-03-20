"use client";

import { Button } from "@shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/select";

const DAY_RANGE_OPTIONS = [
  { value: "Lunes a Viernes", label: "Lunes a Viernes" },
  { value: "Lunes a Jueves", label: "Lunes a Jueves" },
  { value: "Lunes a Sábado", label: "Lunes a Sábado" },
  { value: "custom", label: "Personalizado" },
] as const;

const DAYS_OF_WEEK = [
  { value: "Lunes", label: "Lun" },
  { value: "Martes", label: "Mar" },
  { value: "Miércoles", label: "Mié" },
  { value: "Jueves", label: "Jue" },
  { value: "Viernes", label: "Vie" },
  { value: "Sábado", label: "Sáb" },
  { value: "Domingo", label: "Dom" },
] as const;

interface WorkSchedulePickerProps {
  value?: string;
  onChange: (value: string) => void;
}

interface TimeState {
  hour: string;
  period: "AM" | "PM";
}

function formatTime(t: TimeState): string {
  return `${t.hour}:00 ${t.period}`;
}

function parseTime(raw: string): TimeState {
  const match = raw.match(/^(\d{1,2}):\d{2}\s?(AM|PM)$/i);
  if (!match) return { hour: "9", period: "AM" };
  return { hour: match[1], period: match[2].toUpperCase() as "AM" | "PM" };
}

function parseSchedule(value: string | undefined): {
  dayRange: string;
  selectedDays: string[];
  start: TimeState;
  end: TimeState;
} {
  const defaultStart: TimeState = { hour: "9", period: "AM" };
  const defaultEnd: TimeState = { hour: "6", period: "PM" };

  if (!value)
    return {
      dayRange: "Lunes a Viernes",
      selectedDays: [],
      start: defaultStart,
      end: defaultEnd,
    };

  // Try new format: "Lunes a Viernes, 9:00 AM - 6:00 PM"
  // or custom: "Lunes, Miércoles, Viernes, 9:00 AM - 6:00 PM"
  const timeMatch = value.match(
    /(\d{1,2}:\d{2}\s?(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s?(?:AM|PM))$/i,
  );

  if (timeMatch) {
    const timePartStart = timeMatch.index!;
    const dayPart = value
      .substring(0, timePartStart)
      .replace(/,\s*$/, "")
      .trim();

    if (dayPart) {
      // Has day info
      const isKnownRange = DAY_RANGE_OPTIONS.some(
        (o) => o.value !== "custom" && o.value === dayPart,
      );
      return {
        dayRange: isKnownRange ? dayPart : "custom",
        selectedDays: isKnownRange ? [] : dayPart.split(", "),
        start: parseTime(timeMatch[1]),
        end: parseTime(timeMatch[2]),
      };
    }
  }

  // Legacy: "9:00 AM - 6:00 PM"
  const parts = value.split(" - ");
  return {
    dayRange: "Lunes a Viernes",
    selectedDays: [],
    start: parts[0] ? parseTime(parts[0]) : defaultStart,
    end: parts[1] ? parseTime(parts[1]) : defaultEnd,
  };
}

function buildSchedule(
  dayRange: string,
  selectedDays: string[],
  start: TimeState,
  end: TimeState,
): string {
  const dayPart = dayRange === "custom" ? selectedDays.join(", ") : dayRange;
  return `${dayPart}, ${formatTime(start)} - ${formatTime(end)}`;
}

const HOURS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];

interface TimeSelectorProps {
  label: string;
  time: TimeState;
  onHourChange: (h: string) => void;
  onPeriodChange: (p: "AM" | "PM") => void;
}

function TimeSelector({
  label,
  time,
  onHourChange,
  onPeriodChange,
}: TimeSelectorProps) {
  return (
    <div className="flex-1 space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex gap-1">
        {/* Hour */}
        <Select value={time.hour} onValueChange={onHourChange}>
          <SelectTrigger className="h-9 flex-1 px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* AM/PM */}
        <Select
          value={time.period}
          onValueChange={(v) => onPeriodChange(v as "AM" | "PM")}
        >
          <SelectTrigger className="h-9 w-16 px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function WorkSchedulePicker({
  value,
  onChange,
}: WorkSchedulePickerProps) {
  const { dayRange, selectedDays, start, end } = parseSchedule(value);

  const emit = (
    dr: string,
    days: string[],
    s: TimeState,
    e: TimeState,
  ) => {
    onChange(buildSchedule(dr, days, s, e));
  };

  const updateDayRange = (newRange: string) => {
    emit(newRange, newRange === "custom" ? selectedDays : [], start, end);
  };

  const toggleDay = (day: string) => {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    emit("custom", next, start, end);
  };

  const updateStart = (patch: Partial<TimeState>) => {
    const next = { ...start, ...patch };
    emit(dayRange, selectedDays, next, end);
  };

  const updateEnd = (patch: Partial<TimeState>) => {
    const next = { ...end, ...patch };
    emit(dayRange, selectedDays, start, next);
  };

  const preview = buildSchedule(dayRange, selectedDays, start, end);

  return (
    <div className="space-y-3">
      {/* Day range selector */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Días</p>
        <Select value={dayRange} onValueChange={updateDayRange}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAY_RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom day toggle buttons */}
      {dayRange === "custom" && (
        <div className="flex flex-wrap gap-1">
          {DAYS_OF_WEEK.map((day) => {
            const isActive = selectedDays.includes(day.value);
            return (
              <Button
                key={day.value}
                type="button"
                size="sm"
                variant={isActive ? "default" : "outline"}
                className="h-8 px-2.5 text-xs"
                onClick={() => toggleDay(day.value)}
              >
                {day.label}
              </Button>
            );
          })}
        </div>
      )}

      {/* Time selectors */}
      <div className="flex items-start gap-3">
        <TimeSelector
          label="Entrada"
          time={start}
          onHourChange={(h) => updateStart({ hour: h })}
          onPeriodChange={(p) => updateStart({ period: p })}
        />
        <div className="flex items-end pb-2 text-muted-foreground font-medium text-sm pt-6">
          —
        </div>
        <TimeSelector
          label="Salida"
          time={end}
          onHourChange={(h) => updateEnd({ hour: h })}
          onPeriodChange={(p) => updateEnd({ period: p })}
        />
      </div>

      {/* Preview */}
      {preview && (
        <p className="text-xs text-muted-foreground">
          Horario: <span className="font-medium text-foreground">{preview}</span>
        </p>
      )}
    </div>
  );
}
