"use client";

import { NumericFormat } from "react-number-format";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import { Textarea } from "@shadcn/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/select";
import { Field, FieldError, FieldLabel } from "@shadcn/field";
import { LoadingButton } from "@shadcn/loading-button";
import { CurrencyInput } from "@/core/shared/components/CurrencyInput";
import { PercentInput } from "@/core/shared/components/PercentInput";
import { useEditClientForm } from "../hooks/useEditClientForm";
import type { ClientDTO } from "../types/client.types";
import {
  CurrencyLabels,
  PaymentSchemeLabels,
  AdvanceTypeLabels,
  FeeTypeLabels,
} from "../types/client.types";

interface EditClientFormProps {
  client: ClientDTO;
  onClose: () => void;
}

export function EditClientForm({ client, onClose }: EditClientFormProps) {
  const { form, isAdvance, feeType, advanceType, isSubmitting } =
    useEditClientForm({ onClose, client });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      {/* ── Sección 1: Datos Generales ────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Datos Generales
        </legend>

        <form.Field name="nombre">
          {(field) => {
            const isEmpty =
              field.state.meta.isTouched && !field.state.value?.trim();
            return (
              <Field data-invalid={isEmpty}>
                <FieldLabel htmlFor={field.name}>
                  Razón Social *
                </FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Razón social del cliente"
                  aria-invalid={isEmpty}
                />
                {isEmpty && (
                  <FieldError>La razón social es requerida</FieldError>
                )}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="nombreComercial">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Nombre Comercial</FieldLabel>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Nombre comercial"
              />
            </Field>
          )}
        </form.Field>
      </fieldset>

      {/* ── Sección 2: Términos Comerciales ───────────────────── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Términos Comerciales
        </legend>

        {/* Currency */}
        <form.Field name="currency">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Moneda</FieldLabel>
              <Select
                value={field.state.value || "none"}
                onValueChange={(v) =>
                  field.handleChange(v === "none" ? "" : v)
                }
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Seleccionar moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Seleccionar moneda</SelectItem>
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

        {/* Payment Scheme */}
        <form.Field name="paymentScheme">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Esquema de cobro</FieldLabel>
              <Select
                value={field.state.value || "none"}
                onValueChange={(v) => {
                  const newValue = v === "none" ? "" : v;
                  field.handleChange(newValue);
                  if (newValue === "ADVANCE") {
                    const currentAdvType = form.getFieldValue("advanceType");
                    if (!currentAdvType) {
                      form.setFieldValue("advanceType", "FIXED");
                    }
                    if (form.getFieldValue("advanceValue") == null) {
                      form.setFieldValue("advanceValue", 0);
                    }
                  } else {
                    form.setFieldValue("advanceType", "");
                    form.setFieldValue("advanceValue", null);
                  }
                }}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Seleccionar esquema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Seleccionar esquema</SelectItem>
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

        {/* Advance fields (conditional) */}
        {isAdvance && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <form.Field name="advanceType">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Tipo de anticipo
                  </FieldLabel>
                  <Select
                    value={field.state.value || "FIXED"}
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

        {/* Fee Type + Fee Value */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <form.Field name="feeType">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Tipo de fee</FieldLabel>
                <Select
                  value={field.state.value || "none"}
                  onValueChange={(v) =>
                    field.handleChange(v === "none" ? "" : v)
                  }
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Seleccionar tipo" />
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
                    value={field.state.value ?? ""}
                    onChange={(v) =>
                      field.handleChange(v === "" ? null : parseFloat(v))
                    }
                    placeholder="0"
                    onBlur={field.handleBlur}
                  />
                ) : feeType === "MONTHS" ? (
                  <NumericFormat
                    id={field.name}
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

        {/* Credit Days + Warranty Months */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <form.Field name="creditDays">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Días de crédito</FieldLabel>
                <NumericFormat
                  id={field.name}
                  customInput={Input}
                  value={field.state.value ?? ""}
                  decimalScale={0}
                  allowNegative={false}
                  suffix=" días"
                  placeholder="0 días"
                  onValueChange={({ floatValue }) =>
                    field.handleChange(floatValue ?? null)
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
                  value={field.state.value ?? ""}
                  decimalScale={1}
                  decimalSeparator="."
                  allowNegative={false}
                  suffix=" meses"
                  placeholder="0 meses"
                  onValueChange={({ floatValue }) =>
                    field.handleChange(floatValue ?? null)
                  }
                  onBlur={field.handleBlur}
                />
              </Field>
            )}
          </form.Field>
        </div>

        {/* Cancellation Fee */}
        <form.Field name="cancellationFee">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>
                Penalización por cancelación (opcional)
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
      </fieldset>

      {/* ── Sección 3: Datos Fiscales ─────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Datos Fiscales
        </legend>

        {/* RFC + Código Postal Fiscal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <form.Field name="rfc">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>RFC</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value.toUpperCase().slice(0, 13),
                    )
                  }
                  onBlur={field.handleBlur}
                  placeholder="XAXX010101000"
                  maxLength={13}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="codigoPostalFiscal">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>
                  Código Postal Fiscal
                </FieldLabel>
                <Input
                  id={field.name}
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

        {/* Régimen Fiscal */}
        <form.Field name="regimenFiscal">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Régimen Fiscal</FieldLabel>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="General de Ley PM"
              />
            </Field>
          )}
        </form.Field>

        {/* Ubicación */}
        <form.Field name="ubicacion">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Ubicación</FieldLabel>
              <Textarea
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Dirección fiscal completa"
                rows={2}
              />
            </Field>
          )}
        </form.Field>

        {/* Figura */}
        <form.Field name="figura">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Figura</FieldLabel>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Persona Moral"
              />
            </Field>
          )}
        </form.Field>
      </fieldset>

      {/* ── Botones de acción ─────────────────────────────────── */}
      <div className="flex justify-end gap-2 pt-2">
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
