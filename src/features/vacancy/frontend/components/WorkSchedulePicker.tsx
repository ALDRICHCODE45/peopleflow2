"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/select";

interface WorkSchedulePickerProps {
  value?: string;
  onChange: (value: string) => void;
}

interface TimeState {
  hour: string;
  minute: string;
  period: "AM" | "PM";
}

function parseTime(raw: string): TimeState {
  const match = raw.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return { hour: "9", minute: "00", period: "AM" };
  return {
    hour: match[1],
    minute: match[2],
    period: match[3].toUpperCase() as "AM" | "PM",
  };
}

function formatTime(t: TimeState): string {
  return `${t.hour}:${t.minute} ${t.period}`;
}

function buildSchedule(start: TimeState, end: TimeState): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

function parseSchedule(value: string | undefined): {
  start: TimeState;
  end: TimeState;
} {
  const defaultStart: TimeState = { hour: "9", minute: "00", period: "AM" };
  const defaultEnd: TimeState = { hour: "6", minute: "00", period: "PM" };
  if (!value) return { start: defaultStart, end: defaultEnd };

  const parts = value.split(" - ");
  return {
    start: parts[0] ? parseTime(parts[0]) : defaultStart,
    end: parts[1] ? parseTime(parts[1]) : defaultEnd,
  };
}

const HOURS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const MINUTES = ["00", "15", "30", "45"];

interface TimeSelectorProps {
  label: string;
  time: TimeState;
  onHourChange: (h: string) => void;
  onMinuteChange: (m: string) => void;
  onPeriodChange: (p: "AM" | "PM") => void;
}

function TimeSelector({
  label,
  time,
  onHourChange,
  onMinuteChange,
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

        <span className="flex items-center text-muted-foreground font-medium text-sm">
          :
        </span>

        {/* Minutes */}
        <Select value={time.minute} onValueChange={onMinuteChange}>
          <SelectTrigger className="h-9 w-16 px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MINUTES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
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

export function WorkSchedulePicker({ value, onChange }: WorkSchedulePickerProps) {
  const { start, end } = parseSchedule(value);

  const updateStart = (patch: Partial<TimeState>) => {
    const next = { ...start, ...patch };
    onChange(buildSchedule(next, end));
  };

  const updateEnd = (patch: Partial<TimeState>) => {
    const next = { ...end, ...patch };
    onChange(buildSchedule(start, next));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <TimeSelector
          label="Entrada"
          time={start}
          onHourChange={(h) => updateStart({ hour: h })}
          onMinuteChange={(m) => updateStart({ minute: m })}
          onPeriodChange={(p) => updateStart({ period: p })}
        />
        <div className="flex items-end pb-2 text-muted-foreground font-medium text-sm pt-6">
          —
        </div>
        <TimeSelector
          label="Salida"
          time={end}
          onHourChange={(h) => updateEnd({ hour: h })}
          onMinuteChange={(m) => updateEnd({ minute: m })}
          onPeriodChange={(p) => updateEnd({ period: p })}
        />
      </div>
      {value && (
        <p className="text-xs text-muted-foreground">
          Horario: <span className="font-medium text-foreground">{value}</span>
        </p>
      )}
    </div>
  );
}
