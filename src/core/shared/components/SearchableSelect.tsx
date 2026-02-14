"use client";

import { cn } from "@lib/utils";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps<T extends SearchableSelectOption> {
  options: T[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  renderOption?: (option: T) => ReactNode;
  renderSelected?: (option: T) => ReactNode;
  emptyMessage?: string;
}

export function SearchableSelect<T extends SearchableSelectOption>({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  className,
  disabled = false,
  renderOption,
  renderSelected,
  emptyMessage = "Sin resultados.",
}: SearchableSelectProps<T>) {
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
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

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
        {selected ? (
          renderSelected ? (
            renderSelected(selected)
          ) : (
            <span className="truncate">{selected.label}</span>
          )
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
            {filtered.length === 0 ? (
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
                    }}
                  >
                    {renderOption ? (
                      renderOption(option)
                    ) : (
                      <span className="truncate">{option.label}</span>
                    )}
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
          </div>
        </div>
      )}
    </div>
  );
}
