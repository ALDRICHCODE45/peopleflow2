"use client";

import { useState, useEffect, useRef, useMemo, forwardRef } from "react";
import parsePhoneNumber, { isValidPhoneNumber } from "libphonenumber-js";
import { CircleFlag } from "react-circle-flags";
import { lookup } from "country-data-list";
import { z } from "zod";

import { cn } from "@/core/lib/utils";
import { Input } from "@shadcn/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Globe } from "@hugeicons/core-free-icons";

export const phoneSchema = z.string().refine((value) => {
  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
}, "Invalid phone number");

export type CountryData = {
  alpha2: string;
  alpha3: string;
  countryCallingCodes: string[];
  currencies: string[];
  emoji?: string;
  ioc: string;
  languages: string[];
  name: string;
  status: string;
};

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onCountryChange?: (data: CountryData | undefined) => void;
  placeholder?: string;
  defaultCountry?: string;
  className?: string;
}

// Build country list once
const allCountries: CountryData[] = lookup
  .countries({})
  .filter(
    (c: CountryData) =>
      c.status === "assigned" &&
      c.countryCallingCodes &&
      c.countryCallingCodes.length > 0,
  );

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      className,
      onCountryChange,
      onChange,
      value = "",
      placeholder = "+52",
      defaultCountry = "MX",
    },
    ref,
  ) => {
    const [selectedCountry, setSelectedCountry] = useState<
      CountryData | undefined
    >(undefined);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [hasInitialized, setHasInitialized] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Initialize default country
    useEffect(() => {
      if (hasInitialized) return;
      if (defaultCountry) {
        const country = allCountries.find(
          (c) => c.alpha2.toLowerCase() === defaultCountry.toLowerCase(),
        );
        if (country) {
          setSelectedCountry(country);
          if (!value && country.countryCallingCodes[0]) {
            onChange?.(country.countryCallingCodes[0]);
          }
        }
      }
      setHasInitialized(true);
    }, [defaultCountry, hasInitialized, onChange, value]);

    // Filter countries by search
    const filtered = useMemo(() => {
      if (!search) return allCountries;
      const q = search.toLowerCase();
      return allCountries.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.alpha2.toLowerCase().includes(q) ||
          c.countryCallingCodes.some((code) => code.includes(q)),
      );
    }, [search]);

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

    // Close on escape
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
        requestAnimationFrame(() => searchInputRef.current?.focus());
      }
    }, [open]);

    // Select a country from the dropdown
    const handleSelectCountry = (country: CountryData) => {
      setSelectedCountry(country);
      onCountryChange?.(country);
      setOpen(false);
      setSearch("");

      // Replace calling code in current value
      const callingCode = country.countryCallingCodes[0];
      if (callingCode) {
        // Try to extract the national number from the current value
        if (value) {
          try {
            const parsed = parsePhoneNumber(value);
            if (parsed?.nationalNumber) {
              onChange?.(callingCode + parsed.nationalNumber);
              return;
            }
          } catch {
            // ignore
          }
        }
        onChange?.(callingCode);
      }
    };

    // Handle phone input changes
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;

      // Ensure the value starts with "+"
      if (!newValue.startsWith("+")) {
        if (newValue.startsWith("00")) {
          newValue = "+" + newValue.slice(2);
        } else {
          newValue = "+" + newValue;
        }
      }

      try {
        const parsed = parsePhoneNumber(newValue);
        if (parsed?.country) {
          const countryInfo = allCountries.find(
            (c) => c.alpha2 === parsed.country,
          );
          if (countryInfo) {
            setSelectedCountry(countryInfo);
            onCountryChange?.(countryInfo);
          }
          onChange?.(parsed.number);
        } else {
          onChange?.(newValue);
        }
      } catch {
        onChange?.(newValue);
      }
    };

    const flagCode = selectedCountry?.alpha2?.toLowerCase();

    return (
      <div ref={containerRef} className="relative">
        <div
          className={cn(
            "flex items-center gap-0 rounded-md border border-input bg-transparent shadow-sm transition-colors has-[input:focus]:outline-none has-[input:focus]:ring-1 has-[input:focus]:ring-ring",
            className,
          )}
        >
          {/* Country selector trigger */}
          <button
            type="button"
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-l-md border-r border-input px-2.5 py-2 hover:bg-accent transition-colors"
            onClick={() => setOpen((prev) => !prev)}
          >
            <div className="size-5 shrink-0">
              {flagCode ? (
                <CircleFlag
                  countryCode={flagCode}
                  className="size-5 shrink-0"
                />
              ) : (
                <HugeiconsIcon
                  icon={Globe}
                  className="size-5 text-muted-foreground"
                />
              )}
            </div>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          </button>

          {/* Phone number input */}
          <input
            ref={ref}
            value={value}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            type="tel"
            autoComplete="tel"
            name="phone"
            className="h-9 w-full bg-transparent px-3 text-base placeholder:text-muted-foreground outline-none md:text-sm"
          />
        </div>

        {/* Country dropdown */}
        {open && (
          <div className="bg-popover ring-foreground/10 absolute left-0 top-full z-50 mt-1 w-full rounded-lg shadow-md ring-1">
            <div className="p-2 pb-1.5">
              <Input
                ref={searchInputRef}
                placeholder="Buscar país..."
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
                filtered.map((country) => {
                  const isSelected =
                    selectedCountry?.alpha2 === country.alpha2;
                  return (
                    <button
                      key={country.alpha2}
                      type="button"
                      className={cn(
                        "relative flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent text-accent-foreground",
                      )}
                      onClick={() => handleSelectCountry(country)}
                    >
                      <CircleFlag
                        countryCode={country.alpha2.toLowerCase()}
                        className="size-5 shrink-0"
                      />
                      <span className="truncate">{country.name}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        ({country.countryCallingCodes[0]})
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
);

PhoneInput.displayName = "PhoneInput";
