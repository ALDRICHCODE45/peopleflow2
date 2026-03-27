/**
 * Servicio de dominio para cálculos de facturación
 * Stateless — todos los métodos son estáticos y puros (sin side effects)
 */

import type { Currency, FeeType } from "@/core/generated/prisma/client";
import { InvoiceFee } from "../value-objects/InvoiceCalculation";

// --- Utilidad de redondeo a 2 decimales ---

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

// --- Tipos de resultado ---

export interface FeeCalculationResult {
  subtotal: number;
  ivaRate: number;
  ivaAmount: number;
  anticipoDeduccion: number;
  total: number;
}

export interface FullInvoiceCalculationInput {
  feeType: FeeType;
  feeValue: number;
  salaryFixed: number;
  currency: Currency;
  anticipoAmount?: number;
}

export class InvoiceCalculationService {
  /**
   * Calcula el monto base del fee según tipo, valor y salario
   */
  static calculateFee(
    feeType: FeeType,
    feeValue: number,
    salaryFixed: number
  ): number {
    const fee = new InvoiceFee({ feeType, feeValue, salaryFixed });
    return fee.calculateBase();
  }

  /**
   * Determina la tasa de IVA según la moneda:
   * - MXN: 16% (0.16)
   * - USD: 0% (0.0)
   */
  static calculateIvaRate(currency: Currency): number {
    return currency === "MXN" ? 0.16 : 0.0;
  }

  /**
   * Calcula IVA y total a partir de subtotal + tasa de IVA + deducción de anticipo
   */
  static calculateTotal(params: {
    subtotal: number;
    ivaRate: number;
    anticipoAmount?: number;
  }): { ivaAmount: number; total: number } {
    const { subtotal, ivaRate, anticipoAmount = 0 } = params;
    const ivaAmount = roundCurrency(subtotal * ivaRate);
    const total = roundCurrency(subtotal + ivaAmount - anticipoAmount);
    return { ivaAmount, total };
  }

  /**
   * Back-calcula subtotal e IVA a partir de un total manual (para ANTICIPO).
   * El usuario ingresa un total y el sistema deduce el desglose:
   * - MXN: subtotal = total / 1.16, ivaAmount = total - subtotal
   * - USD: subtotal = total, ivaAmount = 0
   */
  static calculateFromAnticipo(
    totalInput: number,
    ivaRate: number
  ): { subtotal: number; ivaAmount: number } {
    if (ivaRate === 0) {
      return { subtotal: roundCurrency(totalInput), ivaAmount: 0 };
    }

    const subtotal = roundCurrency(totalInput / (1 + ivaRate));
    const ivaAmount = roundCurrency(totalInput - subtotal);
    return { subtotal, ivaAmount };
  }

  /**
   * Cálculo completo para FULL y LIQUIDACION:
   * 1. Calcula fee base → subtotal
   * 2. Determina IVA rate por moneda
   * 3. Calcula IVA y total (con deducción de anticipo si aplica)
   */
  static calculateFullInvoice(
    params: FullInvoiceCalculationInput
  ): FeeCalculationResult {
    const { feeType, feeValue, salaryFixed, currency, anticipoAmount = 0 } = params;

    const subtotal = InvoiceCalculationService.calculateFee(
      feeType,
      feeValue,
      salaryFixed
    );
    const ivaRate = InvoiceCalculationService.calculateIvaRate(currency);
    const { ivaAmount, total } = InvoiceCalculationService.calculateTotal({
      subtotal,
      ivaRate,
      anticipoAmount,
    });

    return {
      subtotal,
      ivaRate,
      ivaAmount,
      anticipoDeduccion: roundCurrency(anticipoAmount),
      total,
    };
  }
}
