"use client";

import { filterRegions } from "@/core/lib/filter-countries";
import { cn } from "@lib/utils";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
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

  useEffect(() => {
    setSearch("");
  }, [countryCode]);

  // Calculate dropdown position from button
  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      pointerEvents: "auto",
    });
  };

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const dropdownEl = document.getElementById("region-select-dropdown");
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        dropdownEl &&
        !dropdownEl.contains(target)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    const handleScroll = () => updatePosition();
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (open) {
      updatePosition();
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={!countryCode}
        className={cn("w-full justify-between font-normal", className)}
        onClick={() => setOpen((prev) => !prev)}
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

      {open &&
        createPortal(
          <div
            id="region-select-dropdown"
            style={dropdownStyle}
            className="bg-popover ring-foreground/10 rounded-lg shadow-md ring-1"
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
            <div className="max-h-56 overflow-y-auto overscroll-contain px-1 pb-1" onWheel={(e) => e.stopPropagation()}>
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
                        setSearch("");
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
          </div>,
          document.body,
        )}
    </div>
  );
}

export default RegionSelect;
