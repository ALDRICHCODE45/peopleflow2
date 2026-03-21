"use client";

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
  { value: "Lunes", label: "Lunes" },
  { value: "Martes", label: "Martes" },
  { value: "Miércoles", label: "Miércoles" },
  { value: "Jueves", label: "Jueves" },
  { value: "Viernes", label: "Viernes" },
  { value: "Sábado", label: "Sábado" },
  { value: "Domingo", label: "Domingo" },
] as const;

type DayOfWeek = (typeof DAYS_OF_WEEK)[number]["value"];

/** Set of day-range strings that match known presets (not custom). */
const KNOWN_RANGES: Set<string> = new Set(
  DAY_RANGE_OPTIONS.filter((o) => o.value !== "custom").map((o) => o.value),
);

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

interface ParsedSchedule {
  dayRange: string;
  customStartDay: DayOfWeek;
  customEndDay: DayOfWeek;
  start: TimeState;
  end: TimeState;
}

function parseSchedule(value: string | undefined): ParsedSchedule {
  const defaultStart: TimeState = { hour: "9", period: "AM" };
  const defaultEnd: TimeState = { hour: "6", period: "PM" };
  const defaultCustomStart: DayOfWeek = "Lunes";
  const defaultCustomEnd: DayOfWeek = "Viernes";

  if (!value)
    return {
      dayRange: "Lunes a Viernes",
      customStartDay: defaultCustomStart,
      customEndDay: defaultCustomEnd,
      start: defaultStart,
      end: defaultEnd,
    };

  // Format: "DayRange, HH:00 AM - HH:00 PM"
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
      // Custom range with explicit prefix: "custom:Martes a Sábado"
      const customPrefixMatch = dayPart.match(/^custom:(.+?)\s+a\s+(.+)$/);
      if (customPrefixMatch) {
        const startDay = customPrefixMatch[1] as DayOfWeek;
        const endDay = customPrefixMatch[2] as DayOfWeek;
        const isValidStart = DAYS_OF_WEEK.some((d) => d.value === startDay);
        const isValidEnd = DAYS_OF_WEEK.some((d) => d.value === endDay);

        return {
          dayRange: "custom",
          customStartDay: isValidStart ? startDay : defaultCustomStart,
          customEndDay: isValidEnd ? endDay : defaultCustomEnd,
          start: parseTime(timeMatch[1]),
          end: parseTime(timeMatch[2]),
        };
      }

      if (KNOWN_RANGES.has(dayPart)) {
        return {
          dayRange: dayPart,
          customStartDay: defaultCustomStart,
          customEndDay: defaultCustomEnd,
          start: parseTime(timeMatch[1]),
          end: parseTime(timeMatch[2]),
        };
      }

      // Legacy custom range without prefix: "Martes a Sábado" (not a known preset)
      const rangeMatch = dayPart.match(/^(.+?)\s+a\s+(.+)$/);
      if (rangeMatch) {
        const startDay = rangeMatch[1] as DayOfWeek;
        const endDay = rangeMatch[2] as DayOfWeek;
        const isValidStart = DAYS_OF_WEEK.some((d) => d.value === startDay);
        const isValidEnd = DAYS_OF_WEEK.some((d) => d.value === endDay);

        return {
          dayRange: "custom",
          customStartDay: isValidStart ? startDay : defaultCustomStart,
          customEndDay: isValidEnd ? endDay : defaultCustomEnd,
          start: parseTime(timeMatch[1]),
          end: parseTime(timeMatch[2]),
        };
      }

      // Legacy comma-separated fallback — treat as custom with defaults
      return {
        dayRange: "custom",
        customStartDay: defaultCustomStart,
        customEndDay: defaultCustomEnd,
        start: parseTime(timeMatch[1]),
        end: parseTime(timeMatch[2]),
      };
    }
  }

  // Legacy: "9:00 AM - 6:00 PM" (no day part)
  const parts = value.split(" - ");
  return {
    dayRange: "Lunes a Viernes",
    customStartDay: defaultCustomStart,
    customEndDay: defaultCustomEnd,
    start: parts[0] ? parseTime(parts[0]) : defaultStart,
    end: parts[1] ? parseTime(parts[1]) : defaultEnd,
  };
}

function buildSchedule(
  dayRange: string,
  customStartDay: DayOfWeek,
  customEndDay: DayOfWeek,
  start: TimeState,
  end: TimeState,
): string {
  const dayPart =
    dayRange === "custom"
      ? `custom:${customStartDay} a ${customEndDay}`
      : dayRange;
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
  const { dayRange, customStartDay, customEndDay, start, end } =
    parseSchedule(value);

  const emit = (
    dr: string,
    startDay: DayOfWeek,
    endDay: DayOfWeek,
    s: TimeState,
    e: TimeState,
  ) => {
    onChange(buildSchedule(dr, startDay, endDay, s, e));
  };

  const updateDayRange = (newRange: string) => {
    if (newRange === "custom") {
      // Default to Lunes–Viernes when first switching to custom
      emit(newRange, customStartDay, customEndDay, start, end);
    } else {
      emit(newRange, "Lunes", "Viernes", start, end);
    }
  };

  const updateCustomStartDay = (day: DayOfWeek) => {
    emit("custom", day, customEndDay, start, end);
  };

  const updateCustomEndDay = (day: DayOfWeek) => {
    emit("custom", customStartDay, day, start, end);
  };

  const updateStart = (patch: Partial<TimeState>) => {
    const next = { ...start, ...patch };
    emit(dayRange, customStartDay, customEndDay, next, end);
  };

  const updateEnd = (patch: Partial<TimeState>) => {
    const next = { ...end, ...patch };
    emit(dayRange, customStartDay, customEndDay, start, next);
  };

  const previewDayPart =
    dayRange === "custom"
      ? `${customStartDay} a ${customEndDay}`
      : dayRange;
  const preview = `${previewDayPart}, ${formatTime(start)} - ${formatTime(end)}`;

  return (
    <div className="space-y-3">
      {/* Day range selector + custom day pickers inline */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-2">
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

        {dayRange === "custom" && (
          <>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Desde
              </p>
              <Select
                value={customStartDay}
                onValueChange={(v) => updateCustomStartDay(v as DayOfWeek)}
              >
                <SelectTrigger className="h-9 w-full sm:w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden sm:flex items-center pb-1 text-muted-foreground font-medium text-sm">
              a
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Hasta
              </p>
              <Select
                value={customEndDay}
                onValueChange={(v) => updateCustomEndDay(v as DayOfWeek)}
              >
                <SelectTrigger className="h-9 w-full sm:w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

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
          Horario:{" "}
          <span className="font-medium text-foreground">{preview}</span>
        </p>
      )}
    </div>
  );
}
