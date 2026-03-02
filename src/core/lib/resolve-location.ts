import countryRegionData from "country-region-data/data.json";

interface Region {
  name: string;
  shortCode: string;
}

interface CountryRegion {
  countryName: string;
  countryShortCode: string;
  regions: Region[];
}

const data = countryRegionData as CountryRegion[];

/** Resolves a ISO 3166-1 alpha-2 country code (e.g. "MX") to its full name ("Mexico"). */
export function resolveCountryName(code: string | null | undefined): string | null {
  if (!code) return null;
  return data.find((c) => c.countryShortCode === code)?.countryName ?? code;
}

/** Resolves a region short code (e.g. "BCS") to its full name ("Baja California Sur").
 *  Requires the parent country code to scope the lookup. */
export function resolveRegionName(
  countryCode: string | null | undefined,
  regionCode: string | null | undefined,
): string | null {
  if (!countryCode || !regionCode) return null;
  const country = data.find((c) => c.countryShortCode === countryCode);
  if (!country) return regionCode;
  return country.regions.find((r) => r.shortCode === regionCode)?.name ?? regionCode;
}
