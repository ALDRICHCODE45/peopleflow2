"use client";

import { filterCountries } from "@/core/lib/filter-countries";
import { cn } from "@lib/utils";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { CircleFlag } from "react-circle-flags";
import { useEffect, useMemo, useRef, useState } from "react";
import countryRegionData from "country-region-data/data.json";

export interface Region {
  name: string;
  shortCode: string;
}

export interface CountryRegion {
  countryName: string;
  countryShortCode: string;
  regions: Region[];
}

interface CountrySelectProps {
  priorityOptions?: string[];
  whitelist?: string[];
  blacklist?: string[];
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  value?: string;
}

function CountrySelect({
  priorityOptions = [],
  whitelist = [],
  blacklist = [],
  onChange = () => {},
  className,
  placeholder = "Seleccionar pais",
  value,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const countries = useMemo(
    () =>
      filterCountries(
        countryRegionData as CountryRegion[],
        priorityOptions,
        whitelist,
        blacklist,
      ),
    [priorityOptions, whitelist, blacklist],
  );

  const filtered = useMemo(() => {
    if (!search) return countries;
    const q = search.toLowerCase();
    return countries.filter((c) => c.countryName.toLowerCase().includes(q));
  }, [countries, search]);

  const selected = useMemo(
    () => countries.find((c) => c.countryShortCode === value),
    [countries, value],
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
        className={cn("w-full justify-between font-normal", className)}
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected ? (
          <span className="flex items-center gap-2 truncate">
            <CircleFlag
              countryCode={selected.countryShortCode.toLowerCase()}
              className="size-5 shrink-0"
            />
            {selected.countryName}
          </span>
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
              placeholder="Buscar pais..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="max-h-56 overflow-y-auto overscroll-contain px-1 pb-1">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Sin resultados.
              </p>
            ) : (
              filtered.map(({ countryName, countryShortCode }) => {
                const isSelected = value === countryShortCode;
                return (
                  <button
                    key={countryShortCode}
                    type="button"
                    className={cn(
                      "relative flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent text-accent-foreground",
                    )}
                    onClick={() => {
                      onChange(countryShortCode);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <CircleFlag
                      countryCode={countryShortCode.toLowerCase()}
                      className="size-5 shrink-0"
                    />
                    <span className="truncate">{countryName}</span>
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

export default CountrySelect;
