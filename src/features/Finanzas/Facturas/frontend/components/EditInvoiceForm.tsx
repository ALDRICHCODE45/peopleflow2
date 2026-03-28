"use client";

import { NumericFormat } from "react-number-format";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import { Textarea } from "@shadcn/textarea";
import { Field, FieldError, FieldLabel } from "@shadcn/field";
import { LoadingButton } from "@shadcn/loading-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/select";
import { CurrencyInput } from "@/core/shared/components/CurrencyInput";
import { PercentInput } from "@/core/shared/components/PercentInput";
import { DatePicker } from "@/core/shared/ui/shadcn/date-picker";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { InvoiceCalculationPreview } from "./InvoiceCalculationPreview";
import { ComplementoUpload } from "./ComplementoUpload";
import { useEditInvoiceForm } from "../hooks/useEditInvoiceForm";
import {
  FeeTypeLabels,
  CurrencyLabels,
  AdvanceTypeLabels,
  FEE_TYPES,
  ADVANCE_TYPES,
  CURRENCIES,
} from "../types/invoice.types";
import type { InvoiceDTO } from "../types/invoice.types";

// ── Component ───────────────────────────────────────────────────────────────

interface EditInvoiceFormProps {
  invoice: InvoiceDTO;
  onClose: () => void;
}

export function EditInvoiceForm({ invoice, onClose }: EditInvoiceFormProps) {
  const {
    form,
    currency,
    feeType,
    advanceType,
    isAnticipo,
    isLiquidacion,
    isPPD,
    isPorCobrar,
    handleMarkAsPaid,
    isSubmitting,
    isUpdatingStatus,
  } = useEditInvoiceForm({ onClose, invoice });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-6 px-4 pb-4"
    >
      {/* ── Section: Datos Fiscales ───────────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Datos Fiscales
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <form.Field
            name="razonSocial"
            validators={{
              onChange: ({ value }) =>
                !value?.trim() ? "Razón social es requerida" : undefined,
            }}
          >
            {(field) => (
              <Field data-invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}>
                <FieldLabel>Razón Social *</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Razón social"
                />
                {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                  <FieldError>{field.state.meta.errors[0]}</FieldError>
                )}
              </Field>
            )}
          </form.Field>

          <form.Field name="nombreComercial">
            {(field) => (
              <Field>
                <FieldLabel>Nombre Comercial</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Nombre comercial"
                />
              </Field>
            )}
          </form.Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <form.Field name="rfc">
            {(field) => (
              <Field>
                <FieldLabel>RFC</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) =>
                    field.handleChange(e.target.value.toUpperCase().slice(0, 13))
                  }
                  onBlur={field.handleBlur}
                  placeholder="XAXX010101000"
                  maxLength={13}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="codigoPostal">
            {(field) => (
              <Field>
                <FieldLabel>Código Postal Fiscal</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 5);
                    field.handleChange(val);
                  }}
                  onBlur={field.handleBlur}
                  placeholder="06600"
                  maxLength={5}
                />
              </Field>
            )}
          </form.Field>
        </div>

        <form.Field name="regimen">
          {(field) => (
            <Field>
              <FieldLabel>Régimen Fiscal</FieldLabel>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="General de Ley PM"
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="ubicacion">
          {(field) => (
            <Field>
              <FieldLabel>Ubicación</FieldLabel>
              <Textarea
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Dirección fiscal completa"
                rows={2}
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="figura">
          {(field) => (
            <Field>
              <FieldLabel>Figura</FieldLabel>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Persona Moral"
              />
            </Field>
          )}
        </form.Field>
      </fieldset>

      {/* ── Section: Datos de Vacante ─────────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Datos de Vacante
        </legend>

        <form.Field name="posicion">
          {(field) => (
            <Field>
              <FieldLabel>Posición</FieldLabel>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Nombre de la posición"
              />
            </Field>
          )}
        </form.Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <form.Field name="candidateName">
            {(field) => (
              <Field>
                <FieldLabel>Candidato Contratado</FieldLabel>
                <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/20 min-h-[44px]">
                  {field.state.value ? (
                    <>
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {field.state.value
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">
                          {field.state.value}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Sin candidato
                    </span>
                  )}
                </div>
              </Field>
            )}
          </form.Field>

          <form.Field name="hunterName">
            {(field) => (
              <Field>
                <FieldLabel>Hunter / Reclutador</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Nombre del reclutador"
                />
              </Field>
            )}
          </form.Field>
        </div>

        <form.Field name="mesPlacement">
          {(field) => (
            <Field>
              <FieldLabel>Mes de Placement</FieldLabel>
              <Input
                type="month"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
            </Field>
          )}
        </form.Field>
      </fieldset>

      {/* ── Section: Datos Financieros ────────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Datos Financieros
        </legend>

        {/* Currency */}
        <form.Field name="currency">
          {(field) => (
            <Field>
              <FieldLabel>Moneda *</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Moneda" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CurrencyLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        {/* Salary */}
        <form.Field
          name="salario"
          validators={{
            onChange: ({ value }) =>
              value == null || value <= 0 ? "Sueldo es requerido" : undefined,
          }}
        >
          {(field) => (
            <Field data-invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}>
              <FieldLabel>Sueldo *</FieldLabel>
              <CurrencyInput
                value={field.state.value ?? ""}
                onChange={(v) =>
                  field.handleChange(v === "" ? null : parseFloat(v))
                }
                prefix={currency === CURRENCIES.USD ? "USD $ " : "$ "}
                placeholder="0"
              />
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <FieldError>{field.state.meta.errors[0]}</FieldError>
              )}
            </Field>
          )}
        </form.Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Fee Type */}
          <form.Field
            name="feeType"
            validators={{
              onChange: ({ value }) =>
                !value ? "Tipo de fee es requerido" : undefined,
            }}
          >
            {(field) => (
              <Field data-invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}>
                <FieldLabel>Tipo de Fee *</FieldLabel>
                <Select
                  value={field.state.value || "none"}
                  onValueChange={(v) =>
                    field.handleChange(v === "none" ? "" : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de fee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Seleccionar tipo</SelectItem>
                    {Object.entries(FeeTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                  <FieldError>{field.state.meta.errors[0]}</FieldError>
                )}
              </Field>
            )}
          </form.Field>

          {/* Fee Value */}
          <form.Field
            name="feeValue"
            validators={{
              onChange: ({ value }) =>
                value == null || value <= 0
                  ? "Valor del fee es requerido"
                  : undefined,
            }}
          >
            {(field) => (
              <Field data-invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}>
                <FieldLabel>
                  {feeType === FEE_TYPES.PERCENTAGE
                    ? "Porcentaje de Fee *"
                    : feeType === FEE_TYPES.MONTHS
                      ? "Meses de Sueldo *"
                      : "Monto de Fee *"}
                </FieldLabel>
                {feeType === FEE_TYPES.PERCENTAGE ? (
                  <PercentInput
                    value={field.state.value ?? ""}
                    onChange={(v) =>
                      field.handleChange(v === "" ? null : parseFloat(v))
                    }
                    placeholder="0"
                  />
                ) : feeType === FEE_TYPES.MONTHS ? (
                  <NumericFormat
                    customInput={Input}
                    value={field.state.value ?? ""}
                    decimalScale={1}
                    decimalSeparator="."
                    allowNegative={false}
                    suffix=" meses"
                    placeholder="0 meses"
                    onValueChange={({ floatValue }) =>
                      field.handleChange(floatValue ?? null)
                    }
                  />
                ) : (
                  <CurrencyInput
                    value={field.state.value ?? ""}
                    onChange={(v) =>
                      field.handleChange(v === "" ? null : parseFloat(v))
                    }
                    prefix={currency === CURRENCIES.USD ? "USD $ " : "$ "}
                    placeholder="0"
                  />
                )}
                {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                  <FieldError>{field.state.meta.errors[0]}</FieldError>
                )}
              </Field>
            )}
          </form.Field>
        </div>

        {/* Advance fields — ANTICIPO only */}
        {isAnticipo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <form.Field
              name="advanceType"
              validators={{
                onChange: ({ value }) =>
                  isAnticipo && !value
                    ? "Tipo de anticipo es requerido"
                    : undefined,
              }}
            >
              {(field) => (
                <Field data-invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}>
                  <FieldLabel>Tipo de Anticipo *</FieldLabel>
                  <Select
                    value={field.state.value || "none"}
                    onValueChange={(v) =>
                      field.handleChange(v === "none" ? "" : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de anticipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Seleccionar tipo</SelectItem>
                      {Object.entries(AdvanceTypeLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                    <FieldError>{field.state.meta.errors[0]}</FieldError>
                  )}
                </Field>
              )}
            </form.Field>

            <form.Field
              name="advanceValue"
              validators={{
                onChange: ({ value }) => {
                  if (!isAnticipo) return undefined;
                  if (value == null || value <= 0) return "Valor del anticipo es requerido";
                  if (advanceType === ADVANCE_TYPES.PERCENTAGE && value > 100) {
                    return "El porcentaje de anticipo no puede superar 100%";
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <Field data-invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}>
                  <FieldLabel>
                    {advanceType === ADVANCE_TYPES.PERCENTAGE
                      ? "Porcentaje de Anticipo *"
                      : "Monto de Anticipo *"}
                  </FieldLabel>
                  {advanceType === ADVANCE_TYPES.PERCENTAGE ? (
                    <PercentInput
                      value={field.state.value ?? ""}
                      onChange={(v) =>
                        field.handleChange(v === "" ? null : parseFloat(v))
                      }
                      placeholder="0"
                    />
                  ) : (
                    <CurrencyInput
                      value={field.state.value ?? ""}
                      onChange={(v) =>
                        field.handleChange(v === "" ? null : parseFloat(v))
                      }
                      prefix={currency === CURRENCIES.USD ? "USD $ " : "$ "}
                      placeholder="0"
                    />
                  )}
                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                    <FieldError>{field.state.meta.errors[0]}</FieldError>
                  )}
                </Field>
              )}
            </form.Field>
          </div>
        )}

        {/* Anticipo info for LIQUIDACION */}
        {isLiquidacion && invoice.anticipoFolio && (
          <div className="rounded-md border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Anticipo vinculado:</span>
              <span className="font-medium">{invoice.anticipoFolio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monto deducido:</span>
              <span className="font-bold text-blue-700 dark:text-blue-300">
                ${invoice.anticipoDeduccion.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        )}

        {/* Live calculation preview */}
        <form.Subscribe selector={(state) => state.values}>
          {(values) => (
            <InvoiceCalculationPreview
              type={invoice.type}
              currency={values.currency}
              feeType={values.feeType || null}
              feeValue={values.feeValue}
              salario={values.salario}
              advanceType={values.advanceType || null}
              advanceValue={values.advanceValue}
              anticipoTotal={invoice.anticipoTotal ?? null}
            />
          )}
        </form.Subscribe>
      </fieldset>

      {/* ── Section: Datos de Factura ─────────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Datos de Factura
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <form.Field
            name="issuedAt"
            validators={{
              onChange: ({ value }) =>
                !value ? "Fecha de emisión es requerida" : undefined,
            }}
          >
            {(field) => (
              <Field data-invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}>
                <FieldLabel>Fecha de Emisión *</FieldLabel>
                <DatePicker
                  value={field.state.value}
                  onChange={(date) => field.handleChange(date)}
                  placeholder="Seleccionar fecha"
                />
                {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                  <FieldError>{field.state.meta.errors[0]}</FieldError>
                )}
              </Field>
            )}
          </form.Field>

          <form.Field name="banco">
            {(field) => (
              <Field>
                <FieldLabel>Banco</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Banco receptor"
                />
              </Field>
            )}
          </form.Field>
        </div>
      </fieldset>

      {/* ── Section: Complemento PPD ──────────────────────────────── */}
      {isPPD && (
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Complemento de Pago
          </legend>

          <ComplementoUpload
            invoiceId={invoice.id}
            hasComplemento={invoice.hasComplemento}
            complemento={invoice.complemento}
          />
        </fieldset>
      )}

      {/* ── Section: Status Management ────────────────────────────── */}
      {isPorCobrar && (
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Estado de la Factura
          </legend>

          {isPPD && !invoice.hasComplemento && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-700 dark:text-amber-300">
              <HugeiconsIcon
                icon={InformationCircleIcon}
                className="size-5 shrink-0 mt-0.5"
              />
              <span>
                Esta factura es PPD; debe ingresar el complemento antes de
                actualizar el estado a Pagada.
              </span>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            disabled={isUpdatingStatus || (isPPD && !invoice.hasComplemento)}
            onClick={handleMarkAsPaid}
            className="w-full"
          >
            {isUpdatingStatus ? "Actualizando..." : "Marcar como Pagada"}
          </Button>
        </fieldset>
      )}

      {/* ── Submit ─────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cerrar
        </Button>
        <LoadingButton
          type="submit"
          isLoading={isSubmitting}
          loadingText="Guardando..."
        >
          Guardar cambios
        </LoadingButton>
      </div>
    </form>
  );
}
