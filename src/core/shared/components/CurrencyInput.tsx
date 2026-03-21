"use client";

import { NumericFormat } from "react-number-format";
import { Input } from "@shadcn/input";
import { cn } from "@lib/utils";

interface CurrencyInputProps {
  value: string | number | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  prefix?: string;
  id?: string;
  onBlur?: () => void;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  className,
  disabled = false,
  prefix = "$ ",
  id,
  onBlur,
}: CurrencyInputProps) {
  return (
    <NumericFormat
      id={id}
      customInput={Input}
      value={value ?? ""}
      thousandSeparator=","
      decimalSeparator="."
      allowNegative={false}
      prefix={prefix}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(className)}
      onBlur={onBlur}
      onValueChange={({ value: unformatted }) => onChange(unformatted)}
    />
  );
}
