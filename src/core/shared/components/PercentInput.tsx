"use client";

import { NumericFormat } from "react-number-format";
import { Input } from "@shadcn/input";
import { cn } from "@lib/utils";

interface PercentInputProps {
  value: string | number | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  onBlur?: () => void;
  min?: number;
  max?: number;
}

export function PercentInput({
  value,
  onChange,
  placeholder = "0",
  className,
  disabled = false,
  id,
  onBlur,
  min = 0,
  max = 100,
}: PercentInputProps) {
  return (
    <NumericFormat
      id={id}
      customInput={Input}
      value={value ?? ""}
      decimalScale={2}
      decimalSeparator="."
      allowNegative={false}
      suffix=" %"
      placeholder={placeholder}
      disabled={disabled}
      className={cn(className)}
      onBlur={onBlur}
      isAllowed={({ floatValue }) => {
        if (floatValue === undefined) return true;
        return floatValue >= min && floatValue <= max;
      }}
      onValueChange={({ value: unformatted }) => onChange(unformatted)}
    />
  );
}
