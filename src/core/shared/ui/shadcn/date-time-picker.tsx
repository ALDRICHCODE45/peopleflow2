"use client";

import * as React from "react";
import {
  format,
  parse,
  isValid,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
} from "date-fns";
import { es } from "date-fns/locale";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@lib/utils";
import { Button } from "@core/shared/ui/shadcn/button";
import { Calendar } from "@core/shared/ui/shadcn/calendar";
import { Input } from "@core/shared/ui/shadcn/input";
import { Label } from "@core/shared/ui/shadcn/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@core/shared/ui/shadcn/popover";

interface DateTimePickerProps {
  /** DateTime value as local string "YYYY-MM-DDTHH:mm" */
  value?: string;
  /** Callback when datetime changes, receives "YYYY-MM-DDTHH:mm" */
  onChange?: (datetime: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * DateTimePicker component combining shadcn Calendar + time input in a Popover.
 * Accepts and returns datetime as local strings "YYYY-MM-DDTHH:mm".
 * Never converts to UTC — avoids timezone offset bugs.
 */
export function DateTimePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha y hora",
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse "YYYY-MM-DDTHH:mm" to Date object (local time)
  const dateValue = React.useMemo(() => {
    if (!value) return undefined;
    const parsed = parse(value, "yyyy-MM-dd'T'HH:mm", new Date());
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  const timeString = React.useMemo(() => {
    if (!dateValue) return "";
    return format(dateValue, "HH:mm");
  }, [dateValue]);

  const emitChange = (date: Date) => {
    onChange?.(format(date, "yyyy-MM-dd'T'HH:mm"));
  };

  const handleDateSelect = (day: Date | undefined) => {
    if (!day) return;

    // Preserve existing time, or default to current time
    let hours: number;
    let minutes: number;

    if (dateValue) {
      hours = getHours(dateValue);
      minutes = getMinutes(dateValue);
    } else {
      const now = new Date();
      hours = getHours(now);
      minutes = getMinutes(now);
    }

    const updated = setMinutes(setHours(day, hours), minutes);
    emitChange(updated);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    if (!time) return;

    const [h, m] = time.split(":").map(Number);

    // Use current date value, or today as base
    const base = dateValue ?? new Date();
    const updated = setMinutes(setHours(base, h), m);
    emitChange(updated);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateValue && "text-muted-foreground",
            className
          )}
        >
          <HugeiconsIcon
            icon={Calendar01Icon}
            className="mr-2 h-4 w-4 shrink-0"
          />
          {dateValue ? (
            format(dateValue, "eee dd/MM/yyyy HH:mm", { locale: es })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          captionLayout="dropdown"
          mode="single"
          selected={dateValue}
          onSelect={handleDateSelect}
          locale={es}
        />
        <div className="border-t p-3">
          <Label htmlFor="datetime-picker-time" className="text-xs">
            Hora
          </Label>
          <Input
            id="datetime-picker-time"
            type="time"
            value={timeString}
            onChange={handleTimeChange}
            className="mt-1"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
