"use client";

import { memo, useState, useCallback } from "react";
import { Label } from "@shadcn/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shadcn/dropdown-menu";
import { Button } from "@shadcn/button";
import { Badge } from "@shadcn/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@core/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterMultiSelectProps {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const FilterMultiSelect = memo(function FilterMultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = "Seleccionar...",
  disabled = false,
}: FilterMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback(
    (value: string) => {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value));
      } else {
        onChange([...selected, value]);
      }
    },
    [selected, onChange],
  );

  return (
    <div className="space-y-2 w-full min-w-0">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between min-w-0" disabled={disabled}>
            <span className="truncate text-sm text-muted-foreground">
              {selected.length > 0
                ? `${selected.length} seleccionado${selected.length > 1 ? "s" : ""}`
                : placeholder}
            </span>
            {selected.length > 0 && (
              <Badge variant="secondary" className="ml-2 shrink-0">
                {selected.length}
              </Badge>
            )}
            <HugeiconsIcon
              icon={isOpen ? ArrowUp01Icon : ArrowDown01Icon}
              className="ml-auto h-4 w-4 shrink-0 text-muted-foreground"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-48 overflow-y-auto min-w-[var(--radix-dropdown-menu-trigger-width)]"
        >
          {options.map((option) => {
            const isChecked = selected.includes(option.value);
            return (
              <DropdownMenuItem
                key={option.value}
                onSelect={(e) => e.preventDefault()}
                onClick={() => handleToggle(option.value)}
                className="cursor-pointer"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-primary transition-colors",
                    isChecked
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent",
                  )}
                >
                  {isChecked && (
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      className="h-3 w-3"
                      strokeWidth={2}
                    />
                  )}
                </span>
                <span className="text-sm truncate text-muted-foreground">
                  {option.label}
                </span>
              </DropdownMenuItem>
            );
          })}
          {options.length === 0 && (
            <p className="text-sm text-muted-foreground px-2 py-1">
              Sin opciones disponibles
            </p>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});
