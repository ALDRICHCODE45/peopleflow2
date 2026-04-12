import { parse } from "date-fns";

/**
 * Parsea una fecha ISO del servidor ("2024-03-15T00:00:00.000Z")
 * como fecha local, evitando el offset de timezone UTC.
 * Usar SIEMPRE que se necesite convertir un ISO string a Date para display.
 */
export function parseDateOnly(
  isoString: string | null | undefined,
): Date | null {
  if (!isoString) return null;
  const dateOnly = isoString.slice(0, 10); // extrae "yyyy-MM-dd"
  return parse(dateOnly, "yyyy-MM-dd", new Date());
}
