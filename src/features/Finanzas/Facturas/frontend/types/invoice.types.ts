/**
 * Tipos compartidos para el módulo de Facturas
 * Usados tanto en server actions como en hooks/componentes del frontend
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

// --- Label maps para UI ---

export const InvoiceTypeLabels: Record<string, string> = {
  ANTICIPO: "Anticipo",
  FULL: "Full",
  LIQUIDACION: "Liquidaci\u00f3n",
};

export const InvoicePaymentTypeLabels: Record<string, string> = {
  PUE: "PUE - Pago en Una Exhibici\u00f3n",
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
  USD: "USD (D\u00f3lar)",
};

// --- Form data types ---

export interface CreateInvoiceFormData {
  // Invoice type
  type: string;
  paymentType: string;
  // Relations
  clientId: string;
  vacancyId?: string | null;
  anticipoInvoiceId?: string | null;
  // Snapshots: Candidato
  candidateId?: string | null;
  candidateName?: string | null;
  // Snapshots: Hunter
  hunterId?: string | null;
  hunterName?: string | null;
  // Snapshots: Datos fiscales
  razonSocial?: string | null;
  nombreComercial?: string | null;
  ubicacion?: string | null;
  figura?: string | null;
  rfc?: string | null;
  codigoPostal?: string | null;
  regimen?: string | null;
  // Snapshots: Vacante
  posicion?: string | null;
  // Economics
  currency: string;
  salario?: number | null;
  feeType?: string | null;
  feeValue?: number | null;
  advanceType?: string | null;
  advanceValue?: number | null;
  // Dates (ISO strings)
  issuedAt: string;
  mesPlacement?: string | null;
  // Additional
  banco?: string | null;
}

export interface UpdateInvoiceFormData {
  id: string;
  // Snapshots editables
  candidateId?: string | null;
  candidateName?: string | null;
  hunterId?: string | null;
  hunterName?: string | null;
  razonSocial?: string | null;
  nombreComercial?: string | null;
  ubicacion?: string | null;
  figura?: string | null;
  rfc?: string | null;
  codigoPostal?: string | null;
  regimen?: string | null;
  posicion?: string | null;
  // Economics (triggers recalculation)
  currency?: string;
  salario?: number | null;
  feeType?: string | null;
  feeValue?: number | null;
  advanceType?: string | null;
  advanceValue?: number | null;
  // Dates (ISO strings)
  issuedAt?: string;
  mesPlacement?: string | null;
  // Additional
  banco?: string | null;
  vacancyId?: string | null;
}

// --- Result types para server actions ---

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
