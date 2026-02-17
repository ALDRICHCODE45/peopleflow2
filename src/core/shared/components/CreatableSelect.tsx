"use client";

import { cn } from "@lib/utils";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Tick02Icon,
  Add01Icon,
} from "@hugeicons/core-free-icons";
import { useEffect, useMemo, useRef, useState } from "react";

export interface CreatableSelectOption {
  value: string;
  label: string;
}

interface CreatableSelectProps {
  options: CreatableSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  searchPlaceholder?: string;
  createLabel?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function CreatableSelect({
  options,
  value,
  onChange,
  onBlur,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  createLabel = "Agregar",
  emptyMessage = "Sin resultados.",
  className,
  disabled = false,
}: CreatableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  const hasExactMatch = useMemo(() => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return options.some((o) => o.label.toLowerCase() === q);
  }, [options, search]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
        onBlur?.();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onBlur]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
        onBlur?.();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onBlur]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Determine display text
  const displayText = selected
    ? selected.label
    : value
      ? value
      : null;

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        className={cn("w-full justify-between font-normal", className)}
        onClick={() => setOpen((prev) => !prev)}
      >
        {displayText ? (
          <span className="truncate">{displayText}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className="ml-auto size-4 shrink-0 text-muted-foreground"
        />
      </Button>

      {open && (
        <div className="bg-popover ring-foreground/10 absolute left-0 top-full z-50 mt-1 w-full rounded-lg shadow-md ring-1">
          <div className="p-2 pb-1.5">
            <Input
              ref={inputRef}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="max-h-56 overflow-y-auto overscroll-contain px-1 pb-1">
            {filtered.length === 0 && hasExactMatch ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </p>
            ) : (
              filtered.map((option) => {
                const isSelected = value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      "relative flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent text-accent-foreground",
                    )}
                    onClick={() => {
                      onChange?.(option.value);
                      setOpen(false);
                      setSearch("");
                      onBlur?.();
                    }}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        strokeWidth={2}
                        className="ml-auto size-4 shrink-0"
                      />
                    )}
                  </button>
                );
              })
            )}

            {/* Create option */}
            {!hasExactMatch && search.trim() && (
              <button
                type="button"
                className="relative flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground text-primary"
                onClick={() => {
                  onChange?.(search.trim());
                  setOpen(false);
                  setSearch("");
                  onBlur?.();
                }}
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  className="size-4 shrink-0"
                />
                <span className="truncate">
                  {createLabel}: {search.trim()}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
