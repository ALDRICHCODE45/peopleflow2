"use client";

import { NumericFormat } from "react-number-format";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/shared/ui/shadcn/select";
import { Field, FieldLabel } from "@/core/shared/ui/shadcn/field";
import { LoadingButton } from "@/core/shared/ui/shadcn/loading-button";
import { CurrencyInput } from "@/core/shared/components/CurrencyInput";
import { PercentInput } from "@/core/shared/components/PercentInput";
import { useCommercialTermsForm } from "@features/Leads/frontend/hooks/useCommercialTermsForm";

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

export function CommercialTermsDialog({
  open,
  onOpenChange,
  companyName,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CommercialTermsDialogProps) {
  const { form, isAdvance, feeType, advanceType } = useCommercialTermsForm({
    onSubmit,
  });

  const handleCancel = () => {
    form.reset();
    onCancel();
  };

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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="grid gap-4 py-2">
            {/* Row 1: Currency + Initial Positions */}
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="currency">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Moneda</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Seleccionar moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CurrencyLabels).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Field name="initialPositions">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Posiciones iniciales
                    </FieldLabel>
                    <NumericFormat
                      id={field.name}
                      customInput={Input}
                      value={field.state.value}
                      decimalScale={0}
                      allowNegative={false}
                      placeholder="1"
                      isAllowed={({ floatValue }) => {
                        if (floatValue === undefined) return true;
                        return floatValue >= 1;
                      }}
                      onValueChange={({ floatValue }) =>
                        field.handleChange(floatValue ?? 1)
                      }
                      onBlur={field.handleBlur}
                    />
                  </Field>
                )}
              </form.Field>
            </div>

            {/* Row 2: Payment Scheme */}
            <form.Field name="paymentScheme">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Esquema de cobro
                  </FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => {
                      field.handleChange(v);
                      // Pre-populate / clear advance fields on scheme change
                      if (v === "ADVANCE") {
                        const currentAdvType = form.getFieldValue("advanceType");
                        if (!currentAdvType) {
                          form.setFieldValue("advanceType", "FIXED");
                        }
                        if (form.getFieldValue("advanceValue") == null) {
                          form.setFieldValue("advanceValue", 0);
                        }
                      } else {
                        form.setFieldValue("advanceType", null);
                        form.setFieldValue("advanceValue", null);
                      }
                    }}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Seleccionar esquema" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PaymentSchemeLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>

            {/* Row 3: Advance fields (conditional) */}
            {isAdvance && (
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="advanceType">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Tipo de anticipo
                      </FieldLabel>
                      <Select
                        value={field.state.value ?? "FIXED"}
                        onValueChange={(v) => field.handleChange(v)}
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(AdvanceTypeLabels).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </form.Field>

                <form.Field name="advanceValue">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        {advanceType === "PERCENTAGE"
                          ? "Porcentaje de anticipo"
                          : "Monto de anticipo"}
                      </FieldLabel>
                      {advanceType === "PERCENTAGE" ? (
                        <PercentInput
                          id={field.name}
                          value={field.state.value ?? ""}
                          onChange={(v) =>
                            field.handleChange(v === "" ? null : parseFloat(v))
                          }
                          placeholder="0"
                          onBlur={field.handleBlur}
                        />
                      ) : (
                        <CurrencyInput
                          id={field.name}
                          value={field.state.value ?? ""}
                          onChange={(v) =>
                            field.handleChange(v === "" ? null : parseFloat(v))
                          }
                          placeholder="0"
                          onBlur={field.handleBlur}
                        />
                      )}
                    </Field>
                  )}
                </form.Field>
              </div>
            )}

            {/* Row 4: Fee Type + Fee Value */}
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="feeType">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Tipo de fee</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FeeTypeLabels).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Field name="feeValue">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {feeType === "PERCENTAGE"
                        ? "Porcentaje de fee"
                        : feeType === "MONTHS"
                          ? "Meses de sueldo"
                          : "Monto de fee"}
                    </FieldLabel>
                    {feeType === "PERCENTAGE" ? (
                      <PercentInput
                        id={field.name}
                        value={field.state.value}
                        onChange={(v) =>
                          field.handleChange(v === "" ? 0 : parseFloat(v))
                        }
                        placeholder="0"
                        onBlur={field.handleBlur}
                      />
                    ) : feeType === "MONTHS" ? (
                      <NumericFormat
                        id={field.name}
                        customInput={Input}
                        value={field.state.value}
                        decimalScale={1}
                        decimalSeparator="."
                        allowNegative={false}
                        suffix=" meses"
                        placeholder="0 meses"
                        onValueChange={({ floatValue }) =>
                          field.handleChange(floatValue ?? 0)
                        }
                        onBlur={field.handleBlur}
                      />
                    ) : (
                      <CurrencyInput
                        id={field.name}
                        value={field.state.value}
                        onChange={(v) =>
                          field.handleChange(v === "" ? 0 : parseFloat(v))
                        }
                        placeholder="0"
                        onBlur={field.handleBlur}
                      />
                    )}
                  </Field>
                )}
              </form.Field>
            </div>

            {/* Row 5: Credit Days + Warranty Months */}
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="creditDays">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Días de crédito
                    </FieldLabel>
                    <NumericFormat
                      id={field.name}
                      customInput={Input}
                      value={field.state.value}
                      decimalScale={0}
                      allowNegative={false}
                      suffix=" días"
                      placeholder="0 días"
                      onValueChange={({ floatValue }) =>
                        field.handleChange(floatValue ?? 0)
                      }
                      onBlur={field.handleBlur}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="warrantyMonths">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Meses de garantía
                    </FieldLabel>
                    <NumericFormat
                      id={field.name}
                      customInput={Input}
                      value={field.state.value}
                      decimalScale={1}
                      decimalSeparator="."
                      allowNegative={false}
                      suffix=" meses"
                      placeholder="0 meses"
                      onValueChange={({ floatValue }) =>
                        field.handleChange(floatValue ?? 0)
                      }
                      onBlur={field.handleBlur}
                    />
                  </Field>
                )}
              </form.Field>
            </div>

            {/* Row 6: Cancellation Fee */}
            <form.Field name="cancellationFee">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Penalización por cancelación (monto fijo, opcional)
                  </FieldLabel>
                  <CurrencyInput
                    id={field.name}
                    value={field.state.value ?? ""}
                    onChange={(v) =>
                      field.handleChange(v === "" ? null : parseFloat(v))
                    }
                    placeholder="Sin penalización"
                    onBlur={field.handleBlur}
                  />
                </Field>
              )}
            </form.Field>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <LoadingButton
              type="submit"
              isLoading={isSubmitting}
              loadingText="Guardando..."
            >
              Confirmar y asignar
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
