/**
 * Helpers compartidos para el módulo de Facturas.
 * Centralizan formateo de moneda, fees, fechas y utilidades reutilizables.
 */

import { format } from "date-fns";
import { es } from "date-fns/locale";

// ── Currency formatting ─────────────────────────────────────────────────────

/**
 * Formatea un valor numérico como moneda (MXN o USD).
 * Usa Intl.NumberFormat para formateo locale-aware.
 */
export function formatInvoiceCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formatea moneda con prefijo simple (sin locale).
 * Usado en previews de cálculo donde se necesita un formato más compacto.
 */
export function formatCompactCurrency(amount: number, currency: string): string {
  const prefix = currency === "USD" ? "USD $" : "$";
  return `${prefix}${amount.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── Fee formatting ──────────────────────────────────────────────────────────

/**
 * Formatea el valor del fee según su tipo (porcentaje, fijo, meses).
 */
export function formatFeeDisplay(
  feeType: string | null,
  feeValue: number | null,
): string {
  if (!feeType || feeValue == null) return "—";
  switch (feeType) {
    case "PERCENTAGE":
      return `${feeValue}%`;
    case "FIXED":
      return `$${feeValue.toLocaleString("es-MX")}`;
    case "MONTHS":
      return `${feeValue} ${feeValue === 1 ? "mes" : "meses"}`;
    default:
      return String(feeValue);
  }
}

// ── Date formatting ─────────────────────────────────────────────────────────

/**
 * Formatea una fecha ISO a formato legible (ej: "15 Mar 2026").
 * Retorna "—" si el valor es nulo o inválido.
 */
export function formatDateSafe(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    return format(new Date(isoString), "d MMM yyyy", { locale: es });
  } catch {
    return "—";
  }
}

/**
 * Formatea una fecha ISO a formato de mes completo (ej: "marzo 2026").
 * Retorna "—" si el valor es nulo o inválido.
 */
export function formatMonthSafe(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    return format(new Date(isoString), "MMMM yyyy", { locale: es });
  } catch {
    return "—";
  }
}

// ── Date conversion helpers (form ↔ ISO) ────────────────────────────────────

/**
 * Convierte un ISO string a un valor de input date (yyyy-MM-dd).
 */
export function toDateInputValue(isoString: string | null): string {
  if (!isoString) return "";
  try {
    return isoString.split("T")[0];
  } catch {
    return "";
  }
}

/**
 * Convierte un ISO string a un valor de input month (yyyy-MM).
 */
export function toMonthInputValue(isoString: string | null): string {
  if (!isoString) return "";
  try {
    return isoString.substring(0, 7);
  } catch {
    return "";
  }
}

/**
 * Convierte un ISO date string a formato yyyy-MM para input month.
 */
export function toMonthValue(dateIso: string | null): string {
  if (!dateIso) return "";
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${year}-${month}`;
}

// ── Calculation helpers ─────────────────────────────────────────────────────

/**
 * Redondea a 2 decimales (centavos).
 */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

// ── File size formatting ────────────────────────────────────────────────────

/**
 * Formatea bytes a unidad legible (B, KB, MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
