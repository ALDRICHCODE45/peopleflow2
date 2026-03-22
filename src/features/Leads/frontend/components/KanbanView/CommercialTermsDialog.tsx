"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/shared/ui/shadcn/dialog";
import { Button } from "@/core/shared/ui/shadcn/button";
import { Input } from "@/core/shared/ui/shadcn/input";
import { Label } from "@/core/shared/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/shared/ui/shadcn/select";
import { LoadingButton } from "@/core/shared/ui/shadcn/loading-button";

import type { CommercialTermsFormData } from "@features/Finanzas/Clientes/frontend/types/client.types";
import {
  CurrencyLabels,
  PaymentSchemeLabels,
  AdvanceTypeLabels,
  FeeTypeLabels,
} from "@features/Finanzas/Clientes/frontend/types/client.types";

interface CommercialTermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  onSubmit: (data: CommercialTermsFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const DEFAULT_FORM: CommercialTermsFormData = {
  currency: "MXN",
  initialPositions: 1,
  paymentScheme: "SUCCESS_100",
  advanceType: null,
  advanceValue: null,
  feeType: "PERCENTAGE",
  feeValue: 0,
  creditDays: 30,
  cancellationFee: null,
  warrantyMonths: 3,
};

export function CommercialTermsDialog({
  open,
  onOpenChange,
  companyName,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CommercialTermsDialogProps) {
  const [form, setForm] = useState<CommercialTermsFormData>(DEFAULT_FORM);

  const isAdvance = form.paymentScheme === "ADVANCE";

  const updateField = useCallback(
    <K extends keyof CommercialTermsFormData>(
      field: K,
      value: CommercialTermsFormData[K],
    ) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        // Clear advance fields when switching away from ADVANCE
        if (field === "paymentScheme" && value !== "ADVANCE") {
          next.advanceType = null;
          next.advanceValue = null;
        }
        // Pre-populate advance fields when switching to ADVANCE
        if (field === "paymentScheme" && value === "ADVANCE") {
          next.advanceType = next.advanceType ?? "FIXED";
          next.advanceValue = next.advanceValue ?? 0;
        }
        return next;
      });
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    // Clean advance fields if not in advance mode
    const data: CommercialTermsFormData = {
      ...form,
      advanceType: isAdvance ? form.advanceType : null,
      advanceValue: isAdvance ? form.advanceValue : null,
    };
    onSubmit(data);
  }, [form, isAdvance, onSubmit]);

  const handleCancel = useCallback(() => {
    setForm(DEFAULT_FORM);
    onCancel();
  }, [onCancel]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleCancel();
          return;
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Condiciones Comerciales</DialogTitle>
          <DialogDescription>
            Define las condiciones comerciales para{" "}
            <span className="font-medium text-foreground">{companyName}</span>{" "}
            antes de asignar posiciones.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Row 1: Currency + Initial Positions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ct-currency">Moneda</Label>
              <Select
                value={form.currency}
                onValueChange={(v) => updateField("currency", v)}
              >
                <SelectTrigger id="ct-currency">
                  <SelectValue placeholder="Seleccionar moneda" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CurrencyLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ct-initial-positions">Posiciones iniciales</Label>
              <Input
                id="ct-initial-positions"
                type="number"
                min={1}
                value={form.initialPositions}
                onChange={(e) =>
                  updateField(
                    "initialPositions",
                    Math.max(1, parseInt(e.target.value) || 1),
                  )
                }
              />
            </div>
          </div>

          {/* Row 2: Payment Scheme */}
          <div className="space-y-2">
            <Label htmlFor="ct-payment-scheme">Esquema de cobro</Label>
            <Select
              value={form.paymentScheme}
              onValueChange={(v) => updateField("paymentScheme", v)}
            >
              <SelectTrigger id="ct-payment-scheme">
                <SelectValue placeholder="Seleccionar esquema" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PaymentSchemeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 3: Advance fields (conditional) */}
          {isAdvance && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ct-advance-type">Tipo de anticipo</Label>
                <Select
                  value={form.advanceType ?? "FIXED"}
                  onValueChange={(v) => updateField("advanceType", v)}
                >
                  <SelectTrigger id="ct-advance-type">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AdvanceTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ct-advance-value">
                  {form.advanceType === "PERCENTAGE"
                    ? "Porcentaje de anticipo"
                    : "Monto de anticipo"}
                </Label>
                <Input
                  id="ct-advance-value"
                  type="number"
                  min={0}
                  step={form.advanceType === "PERCENTAGE" ? 1 : 0.01}
                  value={form.advanceValue ?? 0}
                  onChange={(e) =>
                    updateField(
                      "advanceValue",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                />
              </div>
            </div>
          )}

          {/* Row 4: Fee Type + Fee Value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ct-fee-type">Tipo de fee</Label>
              <Select
                value={form.feeType}
                onValueChange={(v) => updateField("feeType", v)}
              >
                <SelectTrigger id="ct-fee-type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FeeTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ct-fee-value">
                {form.feeType === "PERCENTAGE"
                  ? "Porcentaje de fee"
                  : form.feeType === "MONTHS"
                    ? "Meses de sueldo"
                    : "Monto de fee"}
              </Label>
              <Input
                id="ct-fee-value"
                type="number"
                min={0}
                step={form.feeType === "PERCENTAGE" ? 1 : 0.01}
                value={form.feeValue}
                onChange={(e) =>
                  updateField("feeValue", parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>

          {/* Row 5: Credit Days + Warranty Months */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ct-credit-days">Dias de credito</Label>
              <Input
                id="ct-credit-days"
                type="number"
                min={0}
                value={form.creditDays}
                onChange={(e) =>
                  updateField(
                    "creditDays",
                    Math.max(0, parseInt(e.target.value) || 0),
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ct-warranty-months">Meses de garantia</Label>
              <Input
                id="ct-warranty-months"
                type="number"
                min={0}
                value={form.warrantyMonths}
                onChange={(e) =>
                  updateField(
                    "warrantyMonths",
                    Math.max(0, parseInt(e.target.value) || 0),
                  )
                }
              />
            </div>
          </div>

          {/* Row 6: Cancellation Fee */}
          <div className="space-y-2">
            <Label htmlFor="ct-cancellation-fee">
              Penalizacion por cancelacion (monto fijo, opcional)
            </Label>
            <Input
              id="ct-cancellation-fee"
              type="number"
              min={0}
              step={0.01}
              placeholder="Sin penalizacion"
              value={form.cancellationFee ?? ""}
              onChange={(e) =>
                updateField(
                  "cancellationFee",
                  e.target.value === ""
                    ? null
                    : parseFloat(e.target.value) || 0,
                )
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <LoadingButton
            isLoading={isSubmitting}
            loadingText="Guardando..."
            onClick={handleSubmit}
          >
            Confirmar y asignar
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
