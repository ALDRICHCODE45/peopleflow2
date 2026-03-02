"use client";

import { filterRegions } from "@/core/lib/filter-countries";
import { cn } from "@lib/utils";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import { Popover, PopoverContent, PopoverTrigger } from "@shadcn/popover";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
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

interface RegionSelectProps {
  countryCode: string;
  priorityOptions?: string[];
  whitelist?: string[];
  blacklist?: string[];
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  value?: string;
}

function RegionSelect({
  countryCode,
  priorityOptions = [],
  whitelist = [],
  blacklist = [],
  onChange = () => {},
  className,
  placeholder = "Seleccionar region",
  value,
}: RegionSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const regions = useMemo(() => {
    const country = (countryRegionData as CountryRegion[]).find(
      (c) => c.countryShortCode === countryCode,
    );
    if (!country) return [];
    return filterRegions(
      country.regions,
      priorityOptions,
      whitelist,
      blacklist,
    );
  }, [countryCode, priorityOptions, whitelist, blacklist]);

  const filtered = useMemo(() => {
    if (!search) return regions;
    const q = search.toLowerCase();
    return regions.filter((r) => r.name.toLowerCase().includes(q));
  }, [regions, search]);

  const selected = useMemo(
    () => regions.find((r) => r.shortCode === value),
    [regions, value],
  );

  // Reset search when country changes
  useEffect(() => {
    setSearch("");
  }, [countryCode]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setSearch("");
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={!countryCode}
          className={cn("w-full justify-between font-normal", className)}
        >
          {selected ? (
            <span className="truncate">{selected.name}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className="ml-auto size-4 shrink-0 text-muted-foreground"
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={4}
        className="p-0 w-[var(--radix-popover-trigger-width)]"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="p-2 pb-1.5">
          <Input
            ref={inputRef}
            placeholder="Buscar region..."
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
            filtered.map(({ name, shortCode }) => {
              const isSelected = value === shortCode;
              return (
                <button
                  key={shortCode}
                  type="button"
                  className={cn(
                    "relative flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent text-accent-foreground",
                  )}
                  onClick={() => {
                    onChange(shortCode);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{name}</span>
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
      </PopoverContent>
    </Popover>
  );
}

export default RegionSelect;
