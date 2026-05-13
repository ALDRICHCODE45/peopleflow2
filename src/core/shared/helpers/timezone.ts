/**
 * Timezone helper for Mexico City (America/Mexico_City).
 *
 * WHY: `new Date(new Date().toLocaleString("en-US", { timeZone }))` is unreliable
 * on servers running in UTC (e.g. Docker). The parsed Date keeps the server's UTC
 * offset, so comparisons against Prisma timestamps (stored as UTC) produce wrong
 * ranges.
 *
 * This module computes the UTC offset for Mexico City at the current instant and
 * returns proper UTC Date objects for start-of-day and end-of-day in that timezone,
 * which Prisma can compare directly against UTC timestamps.
 */

const MEXICO_TZ = "America/Mexico_City";

/**
 * Returns the current UTC offset in milliseconds for America/Mexico_City.
 *
 * Works correctly across DST boundaries because it computes the offset
 * at the given instant, not at a fixed value.
 */
function getMexicoCityOffsetMs(now: Date = new Date()): number {
  // Format the current instant in Mexico City to extract numeric parts
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MEXICO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parseInt(parts.find((p) => p.type === type)!.value, 10);

  const mexicoLocal = new Date(
    Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second")
    )
  );

  // offset = mexicoLocal(as UTC) - now(UTC)
  // e.g. CST = UTC-6 → offset = -6h in ms
  return mexicoLocal.getTime() - now.getTime();
}

/**
 * Returns { startOfDay, endOfDay } as UTC Date objects representing
 * midnight→23:59:59.999 in Mexico City on the current date.
 *
 * These are safe to pass directly to Prisma `gte` / `lte` filters
 * on DateTime columns stored in UTC.
 */
export function getMexicoDayRangeUTC(now: Date = new Date()): {
  startOfDay: Date;
  endOfDay: Date;
  nowMexico: Date;
} {
  const offsetMs = getMexicoCityOffsetMs(now);

  // What time is it in Mexico right now (as a UTC-labeled Date for display only)
  const nowMexico = new Date(now.getTime() + offsetMs);

  // Start of day in Mexico = midnight Mexico → convert back to UTC
  const startMexicoLocal = new Date(nowMexico);
  startMexicoLocal.setUTCHours(0, 0, 0, 0);
  const startOfDay = new Date(startMexicoLocal.getTime() - offsetMs);

  // End of day in Mexico = 23:59:59.999 Mexico → convert back to UTC
  const endMexicoLocal = new Date(nowMexico);
  endMexicoLocal.setUTCHours(23, 59, 59, 999);
  const endOfDay = new Date(endMexicoLocal.getTime() - offsetMs);

  return { startOfDay, endOfDay, nowMexico };
}
