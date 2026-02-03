"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@lib/utils";
import { Button } from "@core/shared/ui/shadcn/button";
import { Calendar } from "@core/shared/ui/shadcn/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@core/shared/ui/shadcn/popover";

interface DatePickerProps {
  /** Date value as ISO string (YYYY-MM-DD) */
  value?: string;
  /** Callback when date changes, receives ISO string or empty string */
  onChange?: (date: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disable dates before this date */
  minDate?: string;
  /** Disable dates after this date */
  maxDate?: string;
  /** Additional class names */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * DatePicker component using shadcn Calendar and Popover.
 * Accepts and returns dates as ISO strings (YYYY-MM-DD) for easy state management.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  minDate,
  maxDate,
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse ISO string to Date object
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const parsed = parse(value, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  // Parse min/max dates
  const minDateObj = React.useMemo(() => {
    if (!minDate) return undefined;
    const parsed = parse(minDate, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : undefined;
  }, [minDate]);

  const maxDateObj = React.useMemo(() => {
    if (!maxDate) return undefined;
    const parsed = parse(maxDate, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : undefined;
  }, [maxDate]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Convert to ISO string (YYYY-MM-DD)
      const isoString = format(date, "yyyy-MM-dd");
      onChange?.(isoString);
    } else {
      onChange?.("");
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <HugeiconsIcon
            icon={Calendar01Icon}
            className="mr-2 h-4 w-4 shrink-0"
          />
          {selectedDate ? (
            format(selectedDate, "eee dd/MM/yy", { locale: es })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          captionLayout="dropdown"
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          locale={es}
          disabled={(date) => {
            if (minDateObj && date < minDateObj) return true;
            if (maxDateObj && date > maxDateObj) return true;
            return false;
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
