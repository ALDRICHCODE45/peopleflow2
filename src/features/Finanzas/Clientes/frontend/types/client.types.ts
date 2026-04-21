/**
 * Tipos compartidos para el módulo de Clientes
 * Usados tanto en server actions como en hooks/componentes del frontend
 */

// Re-export de enums Prisma para uso en frontend
export type { Currency, PaymentScheme, AdvanceType, FeeType } from "@/core/generated/prisma/client";

// --- Label maps para UI ---

export const CurrencyLabels: Record<string, string> = {
  MXN: "MXN (Peso Mexicano)",
  USD: "USD (Dólar)",
};

export const PaymentSchemeLabels: Record<string, string> = {
  SUCCESS_100: "100% al éxito",
  ADVANCE: "Con anticipo",
};

export const AdvanceTypeLabels: Record<string, string> = {
  FIXED: "Monto fijo",
  PERCENTAGE: "Porcentaje",
};

export const FeeTypeLabels: Record<string, string> = {
  PERCENTAGE: "Porcentaje del sueldo",
  FIXED: "Monto fijo",
  MONTHS: "Meses de sueldo",
};

// --- DTOs ---

export interface ClientDTO {
  id: string;
  nombre: string;
  leadId: string | null;
  generadorId: string | null;
  generadorName?: string | null;
  origenId: string | null;
  origenName?: string | null;
  tenantId: string;
  createdById: string | null;
  createdByName?: string | null;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  // Condiciones comerciales
  currency: string | null;
  initialPositions: number | null;
  paymentScheme: string | null;
  advanceType: string | null;
  advanceValue: number | null;
  feeType: string | null;
  feeValue: number | null;
  creditDays: number | null;
  cancellationFee: number | null;
  warrantyMonths: number | null;
  // Datos Fiscales
  rfc: string | null;
  codigoPostalFiscal: string | null;
  nombreComercial: string | null;
  ubicacion: string | null;
  regimenFiscal: string | null;
  figura: string | null;
}

// --- Form data para el dialog de datos fiscales ---

export interface FiscalDataFormData {
  rfc: string;
  codigoPostalFiscal: string;
  nombreComercial: string;
  ubicacion: string;
  regimenFiscal: string;
  figura: string;
}

// --- Form data para el dialog de condiciones comerciales ---

export interface CommercialTermsFormData {
  currency: string;
  initialPositions: number;
  paymentScheme: string;
  advanceType?: string | null;
  advanceValue?: number | null;
  feeType: string;
  feeValue: number;
  creditDays: number;
  cancellationFee?: number | null;
  warrantyMonths: number;
}

// --- Result types para server actions ---

export interface UpdateClientResult {
  error: string | null;
  data?: ClientDTO;
}

export interface UpdateFiscalDataResult {
  error: string | null;
  data?: ClientDTO;
}

export interface DeleteClientActionResult {
  error: string | null;
  success: boolean;
}

// --- Component prop types ---

export interface DeleteClientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  clientName: string;
  isLoading?: boolean;
}
