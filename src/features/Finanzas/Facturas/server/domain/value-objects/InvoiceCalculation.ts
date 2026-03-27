/**
 * Value Objects para cálculos de facturación
 * Inmutables — encapsulan lógica de cálculo y validación
 */

import type { Currency, FeeType } from "@/core/generated/prisma/client";

// --- Utilidad de redondeo a 2 decimales ---

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

// =============================================
// InvoiceFee — encapsula tipo de fee + valor + salario → monto base
// =============================================

export interface InvoiceFeeProps {
  feeType: FeeType;
  feeValue: number;
  salaryFixed: number;
}

export class InvoiceFee {
  readonly feeType: FeeType;
  readonly feeValue: number;
  readonly salaryFixed: number;

  constructor(props: InvoiceFeeProps) {
    this.feeType = props.feeType;
    this.feeValue = props.feeValue;
    this.salaryFixed = props.salaryFixed;
  }

  /**
   * Calcula el monto base del fee según el tipo:
   * - PERCENTAGE: salaryFixed * (feeValue / 100)
   * - FIXED: feeValue directamente
   * - MONTHS: salaryFixed * feeValue (feeValue = cantidad de meses)
   */
  calculateBase(): number {
    switch (this.feeType) {
      case "PERCENTAGE":
        return roundCurrency(this.salaryFixed * (this.feeValue / 100));
      case "FIXED":
        return roundCurrency(this.feeValue);
      case "MONTHS":
        return roundCurrency(this.salaryFixed * this.feeValue);
      default:
        throw new Error(
          `Tipo de fee no soportado: ${this.feeType as string}`
        );
    }
  }
}

// =============================================
// InvoiceTotal — encapsula subtotal + IVA + anticipo → total
// =============================================

export interface InvoiceTotalProps {
  subtotal: number;
  currency: Currency;
  anticipoAmount?: number;
}

export class InvoiceTotal {
  readonly subtotal: number;
  readonly ivaRate: number;
  readonly ivaAmount: number;
  readonly anticipoAmount: number;
  readonly total: number;

  constructor(props: InvoiceTotalProps) {
    this.subtotal = props.subtotal;
    this.ivaRate = props.currency === "MXN" ? 0.16 : 0.0;
    this.anticipoAmount = props.anticipoAmount ?? 0;

    this.ivaAmount = roundCurrency(this.subtotal * this.ivaRate);
    this.total = roundCurrency(
      this.subtotal + this.ivaAmount - this.anticipoAmount
    );
  }

  /**
   * Retorna true si el total es mayor a 0
   * Requerido para validar LIQUIDACION (total después de deducir anticipo)
   */
  isValid(): boolean {
    return this.total > 0;
  }
}
