import { filterRegions } from "@/core/lib/filter-countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/select";

import countryRegionData from "country-region-data/data.json";

import { useEffect, useState } from "react";

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
  placeholder = "Region",
  value,
}: RegionSelectProps) {
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    const regions = (countryRegionData as CountryRegion[]).find(
      (country) => country.countryShortCode === countryCode,
    );

    if (regions) {
      setRegions(
        filterRegions(regions.regions, priorityOptions, whitelist, blacklist),
      );
    }
  }, [countryCode]);

  return (
    <div className="min-h-[20px]">
      <Select
        value={value}
        onValueChange={(value: string) => {
          onChange(value);
        }}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="h-full">
          {regions.map(({ name, shortCode }) => (
            <SelectItem key={shortCode} value={shortCode}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default RegionSelect;
