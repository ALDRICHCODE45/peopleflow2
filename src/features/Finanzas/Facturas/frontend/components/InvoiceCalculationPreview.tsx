"use client";

import { useMemo } from "react";
import { Badge } from "@shadcn/badge";

interface InvoiceCalculationPreviewProps {
  type: string;
  currency: string;
  feeType: string | null;
  feeValue: number | null;
  salario: number | null;
  advanceType: string | null;
  advanceValue: number | null;
  anticipoTotal: number | null;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatCurrency(amount: number, currency: string): string {
  const prefix = currency === "USD" ? "USD $" : "$";
  return `${prefix}${amount.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Real-time calculation preview for invoice financial section.
 * Replicates InvoiceCalculationService logic on the client side.
 */
export function InvoiceCalculationPreview({
  type,
  currency,
  feeType,
  feeValue,
  salario,
  advanceType,
  advanceValue,
  anticipoTotal,
}: InvoiceCalculationPreviewProps) {
  const calculation = useMemo(() => {
    const ivaRate = currency === "MXN" ? 0.16 : 0.0;

    // Calculate fee base (shared by ANTICIPO and FULL/LIQUIDACION)
    if (!feeType || !feeValue || feeValue <= 0) return null;

    let feeBase: number;

    switch (feeType) {
      case "PERCENTAGE":
        if (!salario || salario <= 0) return null;
        feeBase = salario * (feeValue / 100);
        break;
      case "FIXED":
        feeBase = feeValue;
        break;
      case "MONTHS":
        if (!salario || salario <= 0) return null;
        feeBase = salario * feeValue;
        break;
      default:
        return null;
    }

    feeBase = roundCurrency(feeBase);

    if (type === "ANTICIPO") {
      // Forward calc: feeBase → advance → subtotal → +IVA → total
      if (!advanceType || !advanceValue || advanceValue <= 0) return null;

      const subtotal =
        advanceType === "PERCENTAGE"
          ? roundCurrency(feeBase * (advanceValue / 100))
          : roundCurrency(advanceValue);

      const ivaAmount = roundCurrency(subtotal * ivaRate);
      const total = roundCurrency(subtotal + ivaAmount);

      return {
        feeBase,
        advanceType,
        advanceValue,
        subtotal,
        ivaRate,
        ivaAmount,
        anticipoDeduccion: 0,
        total,
      };
    }

    // FULL or LIQUIDACION
    const subtotal = feeBase;
    const ivaAmount = roundCurrency(subtotal * ivaRate);
    const anticipoDeduccion =
      type === "LIQUIDACION" ? roundCurrency(anticipoTotal ?? 0) : 0;
    const total = roundCurrency(subtotal + ivaAmount - anticipoDeduccion);

    return {
      feeBase: null,
      advanceType: null,
      advanceValue: null,
      subtotal,
      ivaRate,
      ivaAmount,
      anticipoDeduccion,
      total,
    };
  }, [type, currency, feeType, feeValue, salario, advanceType, advanceValue, anticipoTotal]);

  if (!calculation) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4 text-center text-sm text-muted-foreground">
        Ingresa los datos para ver el cálculo
      </div>
    );
  }

  const ivaPercent = (calculation.ivaRate * 100).toFixed(0);

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Resumen del cálculo
      </h4>

      <div className="space-y-1.5 text-sm">
        {/* ANTICIPO: show fee base → advance → subtotal chain */}
        {type === "ANTICIPO" && calculation.feeBase != null && (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fee base</span>
              <span className="font-medium">
                {formatCurrency(calculation.feeBase, currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Anticipo (
                {calculation.advanceType === "PERCENTAGE"
                  ? `${calculation.advanceValue}%`
                  : "Fijo"}
                )
              </span>
              <span className="font-medium">
                {formatCurrency(calculation.subtotal, currency)}
              </span>
            </div>
            <div className="border-t my-1" />
          </>
        )}

        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">
            {formatCurrency(calculation.subtotal, currency)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">
            IVA ({ivaPercent}%)
          </span>
          <span className="font-medium">
            {formatCurrency(calculation.ivaAmount, currency)}
          </span>
        </div>

        {type === "LIQUIDACION" && calculation.anticipoDeduccion > 0 && (
          <div className="flex justify-between text-orange-600 dark:text-orange-400">
            <span>Deducción anticipo</span>
            <span className="font-medium">
              - {formatCurrency(calculation.anticipoDeduccion, currency)}
            </span>
          </div>
        )}

        <div className="border-t pt-2 mt-2 flex justify-between items-center">
          <span className="font-semibold">Total</span>
          <span className="text-lg font-bold">
            {formatCurrency(calculation.total, currency)}
          </span>
        </div>

        {calculation.total <= 0 && type === "LIQUIDACION" && (
          <Badge variant="destructive" className="mt-1">
            El total debe ser mayor a 0
          </Badge>
        )}
      </div>
    </div>
  );
}
