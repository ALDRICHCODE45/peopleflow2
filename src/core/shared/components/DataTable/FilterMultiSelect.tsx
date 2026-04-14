"use client";

import { memo, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Label } from "@shadcn/label";
import { Input } from "@shadcn/input";
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
  Search01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@core/lib/utils";

/** Umbral de opciones a partir del cual se muestra el buscador */
const SEARCH_THRESHOLD = 5;

interface FilterOption {
  value: string;
  label: string;
}

interface FilterMultiSelectProps {
  label?: string;
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Placeholder del input de búsqueda (solo visible cuando options > SEARCH_THRESHOLD) */
  searchPlaceholder?: string;
}

export const FilterMultiSelect = memo(function FilterMultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = "Seleccionar...",
  disabled = false,
  searchPlaceholder = "Buscar...",
}: FilterMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const showSearch = options.length > SEARCH_THRESHOLD;

  // Resetear búsqueda al cerrar
  useEffect(() => {
    if (!isOpen) setSearch("");
  }, [isOpen]);

  // Focus al input cuando se abre
  useEffect(() => {
    if (isOpen && showSearch) {
      // Pequeño delay para que el dropdown termine de montar
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [isOpen, showSearch]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

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
      {label && (
        <Label className="text-xs font-medium text-muted-foreground">
          {label}
        </Label>
      )}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between min-w-0"
            disabled={disabled}
          >
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
          className="min-w-[var(--radix-dropdown-menu-trigger-width)] p-0"
          // Evitar que el click en el input cierre el dropdown
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Search input — solo cuando hay muchas opciones */}
          {showSearch && (
            <div className="p-2 border-b border-border sticky top-0 bg-popover z-10">
              <div className="relative">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
                />
                <Input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-8 pl-8 text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  // Evitar que Enter / Escape cierren el dropdown accidentalmente
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.stopPropagation();
                      setSearch("");
                    }
                    if (e.key !== "Tab") e.stopPropagation();
                  }}
                />
              </div>
            </div>
          )}

          {/* Lista de opciones */}
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.map((option) => {
              const isChecked = selected.includes(option.value);
              return (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={(e) => e.preventDefault()}
                  onClick={() => handleToggle(option.value)}
                  className="cursor-pointer gap-2"
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

            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground px-3 py-2 text-center">
                Sin resultados para &quot;{search}&quot;
              </p>
            )}

            {options.length === 0 && !search && (
              <p className="text-sm text-muted-foreground px-3 py-2">
                Sin opciones disponibles
              </p>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});
