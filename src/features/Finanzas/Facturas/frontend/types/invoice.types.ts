/**
 * Tipos compartidos para el módulo de Facturas.
 * Usados tanto en server actions como en hooks/componentes del frontend.
 */

// Re-export de enums Prisma para uso en frontend
export type {
  InvoiceType,
  InvoicePaymentType,
  InvoiceStatus,
  Currency,
  FeeType,
  AdvanceType,
} from "@/core/generated/prisma/client";

// Re-export del DTO canónico del dominio
export type { InvoiceDTO } from "../../server/domain/entities/Invoice";

// ── Label maps para UI ──────────────────────────────────────────────────────

export const InvoiceTypeLabels: Record<string, string> = {
  ANTICIPO: "Anticipo",
  FULL: "Full",
  LIQUIDACION: "Liquidación",
};

export const InvoicePaymentTypeLabels: Record<string, string> = {
  PUE: "PUE - Pago en Una Exhibición",
  PPD: "PPD - Pago en Parcialidades o Diferido",
};

export const InvoiceStatusLabels: Record<string, string> = {
  POR_COBRAR: "Por Cobrar",
  PAGADA: "Pagada",
};

export const FeeTypeLabels: Record<string, string> = {
  PERCENTAGE: "Porcentaje del sueldo",
  FIXED: "Monto Fijo",
  MONTHS: "Meses de Sueldo",
};

export const AdvanceTypeLabels: Record<string, string> = {
  FIXED: "Monto fijo",
  PERCENTAGE: "Porcentaje",
};

export const CurrencyLabels: Record<string, string> = {
  MXN: "MXN (Peso Mexicano)",
  USD: "USD (Dólar)",
};

// ── Invoice type constants (avoid magic strings) ────────────────────────────

export const INVOICE_TYPES = {
  ANTICIPO: "ANTICIPO",
  FULL: "FULL",
  LIQUIDACION: "LIQUIDACION",
} as const;

export const INVOICE_PAYMENT_TYPES = {
  PUE: "PUE",
  PPD: "PPD",
} as const;

export const INVOICE_STATUSES = {
  POR_COBRAR: "POR_COBRAR",
  PAGADA: "PAGADA",
} as const;

export const FEE_TYPES = {
  PERCENTAGE: "PERCENTAGE",
  FIXED: "FIXED",
  MONTHS: "MONTHS",
} as const;

export const ADVANCE_TYPES = {
  FIXED: "FIXED",
  PERCENTAGE: "PERCENTAGE",
} as const;

export const CURRENCIES = {
  MXN: "MXN",
  USD: "USD",
} as const;

// ── Color maps para badges ──────────────────────────────────────────────────

export const invoiceTypeColorMap: Record<string, string> = {
  ANTICIPO: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  FULL: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  LIQUIDACION:
    "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
};

export const paymentTypeColorMap: Record<string, string> = {
  PUE: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  PPD: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
};

export const statusColorMap: Record<string, string> = {
  POR_COBRAR:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  PAGADA: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
};

// ── Form value types (TanStack Form) ────────────────────────────────────────

export interface CreateInvoiceFormValues {
  // Invoice type
  type: string;
  paymentType: string;
  // Relations
  clientId: string;
  vacancyId: string;
  anticipoInvoiceId: string;
  // Snapshots: Candidato
  candidateId: string;
  candidateName: string;
  // Snapshots: Hunter
  hunterId: string;
  hunterName: string;
  // Snapshots: Datos fiscales
  razonSocial: string;
  nombreComercial: string;
  ubicacion: string;
  figura: string;
  rfc: string;
  codigoPostal: string;
  regimen: string;
  // Snapshots: Vacante
  posicion: string;
  // Economics
  currency: string;
  salario: number | null;
  feeType: string;
  feeValue: number | null;
  advanceType: string;
  advanceValue: number | null;
  // Dates
  issuedAt: string;
  mesPlacement: string;
  // Additional
  banco: string;
  // Anticipo derived
  anticipoTotal: number | null;
}

export interface EditInvoiceFormValues {
  // Snapshots: Candidato
  candidateId: string;
  candidateName: string;
  // Snapshots: Hunter
  hunterId: string;
  hunterName: string;
  // Snapshots: Datos fiscales
  razonSocial: string;
  nombreComercial: string;
  ubicacion: string;
  figura: string;
  rfc: string;
  codigoPostal: string;
  regimen: string;
  // Snapshots: Vacante
  posicion: string;
  // Economics
  currency: string;
  salario: number | null;
  feeType: string;
  feeValue: number | null;
  advanceType: string;
  advanceValue: number | null;
  // Dates
  issuedAt: string;
  mesPlacement: string;
  // Additional
  banco: string;
  vacancyId: string;
}

// ── Component prop types ────────────────────────────────────────────────────

export interface CreateInvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface EditInvoiceSheetProps {
  invoice: import("../../server/domain/entities/Invoice").InvoiceDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface InvoiceDetailSheetProps {
  invoice: import("../../server/domain/entities/Invoice").InvoiceDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface DeleteInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  invoiceFolio: string;
  isLoading?: boolean;
}

export interface AnticipoSelectorProps {
  clientId: string | undefined;
  value: string | undefined;
  onChange: (anticipoId: string, anticipoTotal: number) => void;
  disabled?: boolean;
}

export interface ComplementoUploadProps {
  invoiceId: string;
  hasComplemento: boolean;
  disabled?: boolean;
}

// ── Result types para server actions ────────────────────────────────────────

export interface CreateInvoiceResult {
  error: string | null;
  data?: import("../../server/domain/entities/Invoice").InvoiceDTO;
}

export interface UpdateInvoiceResult {
  error: string | null;
  data?: import("../../server/domain/entities/Invoice").InvoiceDTO;
}

export interface DeleteInvoiceResult {
  error: string | null;
  success: boolean;
}

export interface UpdateInvoiceStatusResult {
  error: string | null;
  data?: import("../../server/domain/entities/Invoice").InvoiceDTO;
}
