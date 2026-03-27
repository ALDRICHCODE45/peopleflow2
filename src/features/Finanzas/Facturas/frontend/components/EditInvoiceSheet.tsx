"use client";

import { useCallback, useMemo, useState } from "react";
import { NumericFormat } from "react-number-format";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shadcn/sheet";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import { Textarea } from "@shadcn/textarea";
import { Badge } from "@shadcn/badge";
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
import { useUpdateInvoice } from "../hooks/useUpdateInvoice";
import { useUpdateInvoiceStatus } from "../hooks/useUpdateInvoiceStatus";
import { InvoiceCalculationPreview } from "./InvoiceCalculationPreview";
import { ComplementoUpload } from "./ComplementoUpload";
import {
  InvoiceTypeLabels,
  InvoicePaymentTypeLabels,
  InvoiceStatusLabels,
  FeeTypeLabels,
  CurrencyLabels,
  AdvanceTypeLabels,
} from "../types/invoice.types";
import type { InvoiceDTO, InvoiceStatus } from "../types/invoice.types";
import type { UpdateInvoiceActionInput } from "../../server/presentation/actions/updateInvoice.action";
import type { Currency, FeeType } from "../types/invoice.types";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import { DatePicker } from "@/core/shared/ui/shadcn/date-picker";

// ── Form state ──────────────────────────────────────────────────────────────

interface EditFormState {
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

interface FormErrors {
  [key: string]: string | undefined;
}

function toDateInputValue(isoString: string | null): string {
  if (!isoString) return "";
  try {
    return isoString.split("T")[0];
  } catch {
    return "";
  }
}

function toMonthInputValue(isoString: string | null): string {
  if (!isoString) return "";
  try {
    return isoString.substring(0, 7);
  } catch {
    return "";
  }
}

// ── Component ───────────────────────────────────────────────────────────────

interface EditInvoiceSheetProps {
  invoice: InvoiceDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditInvoiceSheet({
  invoice,
  open,
  onOpenChange,
}: EditInvoiceSheetProps) {
  const isMobile = useIsMobile();
  const updateInvoiceMutation = useUpdateInvoice();
  const updateStatusMutation = useUpdateInvoiceStatus();

  // ── Initialize form from invoice DTO ────────────────────────────────────

  const initialState: EditFormState = useMemo(
    () => ({
      candidateId: invoice.candidateId ?? "",
      candidateName: invoice.candidateName ?? "",
      hunterId: invoice.hunterId ?? "",
      hunterName: invoice.hunterName ?? "",
      razonSocial: invoice.razonSocial ?? "",
      nombreComercial: invoice.nombreComercial ?? "",
      ubicacion: invoice.ubicacion ?? "",
      figura: invoice.figura ?? "",
      rfc: invoice.rfc ?? "",
      codigoPostal: invoice.codigoPostal ?? "",
      regimen: invoice.regimen ?? "",
      posicion: invoice.posicion ?? "",
      currency: invoice.currency,
      salario: invoice.salario,
      feeType: invoice.feeType ?? "",
      feeValue: invoice.feeValue,
      advanceType: invoice.advanceType ?? "",
      advanceValue: invoice.advanceValue ?? null,
      issuedAt: toDateInputValue(invoice.issuedAt),
      mesPlacement: toMonthInputValue(invoice.mesPlacement),
      banco: invoice.banco ?? "",
      vacancyId: invoice.vacancyId ?? "",
    }),
    [invoice],
  );

  const [form, setForm] = useState<EditFormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});

  // ── Derived state ─────────────────────────────────────────────────────────

  const isAnticipo = invoice.type === "ANTICIPO";
  const isLiquidacion = invoice.type === "LIQUIDACION";
  const requiresFee = true; // All types require fee
  const isPPD = invoice.paymentType === "PPD";
  const isPorCobrar = invoice.status === "POR_COBRAR";

  // ── Field updater ─────────────────────────────────────────────────────────

  const updateField = useCallback(
    <K extends keyof EditFormState>(key: K, value: EditFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        if (prev[key]) {
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return prev;
      });
    },
    [],
  );

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!form.razonSocial.trim()) {
      newErrors.razonSocial = "Razón social es requerida";
    }

    if (!form.issuedAt) {
      newErrors.issuedAt = "Fecha de emisión es requerida";
    }

    if (requiresFee) {
      if (!form.salario || form.salario <= 0) {
        newErrors.salario = "Sueldo es requerido";
      }
      if (!form.feeType) {
        newErrors.feeType = "Tipo de fee es requerido";
      }
      if (!form.feeValue || form.feeValue <= 0) {
        newErrors.feeValue = "Valor del fee es requerido";
      }
    }

    if (isAnticipo) {
      if (!form.advanceType) {
        newErrors.advanceType = "Tipo de anticipo es requerido";
      }
      if (!form.advanceValue || form.advanceValue <= 0) {
        newErrors.advanceValue = "Valor del anticipo es requerido";
      }
      if (
        form.advanceType === "PERCENTAGE" &&
        form.advanceValue != null &&
        form.advanceValue > 100
      ) {
        newErrors.advanceValue =
          "El porcentaje de anticipo no puede superar 100%";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, requiresFee, isAnticipo]);

  // ── Submit handler ────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      const input: UpdateInvoiceActionInput = {
        id: invoice.id,
        // Snapshots
        candidateId: form.candidateId || null,
        candidateName: form.candidateName || null,
        hunterId: form.hunterId || null,
        hunterName: form.hunterName || null,
        razonSocial: form.razonSocial || null,
        nombreComercial: form.nombreComercial || null,
        ubicacion: form.ubicacion || null,
        figura: form.figura || null,
        rfc: form.rfc || null,
        codigoPostal: form.codigoPostal || null,
        regimen: form.regimen || null,
        posicion: form.posicion || null,
        // Economics
        currency: form.currency as Currency,
        salario: form.salario,
        feeType: (form.feeType || null) as FeeType | null,
        feeValue: form.feeValue,
        advanceType: form.advanceType || null,
        advanceValue: form.advanceValue,
        // Dates
        issuedAt: form.issuedAt
          ? new Date(form.issuedAt + "T12:00:00").toISOString()
          : undefined,
        mesPlacement: form.mesPlacement
          ? new Date(form.mesPlacement + "-01T12:00:00").toISOString()
          : null,
        // Additional
        banco: form.banco || null,
        vacancyId: form.vacancyId || null,
      };

      await updateInvoiceMutation.mutateAsync(input, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    },
    [form, invoice.id, validate, updateInvoiceMutation, onOpenChange],
  );

  // ── Status change handler ─────────────────────────────────────────────────

  const handleMarkAsPaid = useCallback(async () => {
    await updateStatusMutation.mutateAsync({
      id: invoice.id,
      status: "PAGADA" as InvoiceStatus,
      paymentDate: new Date().toISOString(),
    });
  }, [invoice.id, updateStatusMutation]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        width="2xl"
        side={isMobile ? "bottom" : "right"}
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B] overflow-y-auto p-0"
      >
        <SheetHeader className="p-4 pb-3 space-y-3">
          <SheetTitle className="flex items-center gap-2 text-xl font-semibold">
            Editar Factura {invoice.folio}
            <Badge variant="secondary">{InvoiceTypeLabels[invoice.type] ?? invoice.type}</Badge>
            <Badge
              variant={invoice.status === "PAGADA" ? "default" : "outline"}
            >
              {InvoiceStatusLabels[invoice.status] ?? invoice.status}
            </Badge>
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {InvoicePaymentTypeLabels[invoice.paymentType] ?? invoice.paymentType}
            {" · "}
            {invoice.clientName ?? invoice.razonSocial ?? "Sin cliente"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-4 pb-4">
          {/* ── Section: Datos Fiscales ───────────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Datos Fiscales
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field data-invalid={!!errors.razonSocial}>
                <FieldLabel>Razón Social *</FieldLabel>
                <Input
                  value={form.razonSocial}
                  onChange={(e) => updateField("razonSocial", e.target.value)}
                  placeholder="Razón social"
                />
                {errors.razonSocial && (
                  <FieldError>{errors.razonSocial}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Nombre Comercial</FieldLabel>
                <Input
                  value={form.nombreComercial}
                  onChange={(e) =>
                    updateField("nombreComercial", e.target.value)
                  }
                  placeholder="Nombre comercial"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>RFC</FieldLabel>
                <Input
                  value={form.rfc}
                  onChange={(e) =>
                    updateField("rfc", e.target.value.toUpperCase().slice(0, 13))
                  }
                  placeholder="XAXX010101000"
                  maxLength={13}
                />
              </Field>

              <Field>
                <FieldLabel>Código Postal Fiscal</FieldLabel>
                <Input
                  value={form.codigoPostal}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 5);
                    updateField("codigoPostal", val);
                  }}
                  placeholder="06600"
                  maxLength={5}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Régimen Fiscal</FieldLabel>
              <Input
                value={form.regimen}
                onChange={(e) => updateField("regimen", e.target.value)}
                placeholder="General de Ley PM"
              />
            </Field>

            <Field>
              <FieldLabel>Ubicación</FieldLabel>
              <Textarea
                value={form.ubicacion}
                onChange={(e) => updateField("ubicacion", e.target.value)}
                placeholder="Dirección fiscal completa"
                rows={2}
              />
            </Field>

            <Field>
              <FieldLabel>Figura</FieldLabel>
              <Input
                value={form.figura}
                onChange={(e) => updateField("figura", e.target.value)}
                placeholder="Persona Moral"
              />
            </Field>
          </fieldset>

          {/* ── Section: Datos de Vacante ─────────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Datos de Vacante
            </legend>

            <Field>
              <FieldLabel>Posición</FieldLabel>
              <Input
                value={form.posicion}
                onChange={(e) => updateField("posicion", e.target.value)}
                placeholder="Nombre de la posición"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Candidato Contratado</FieldLabel>
                <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/20 min-h-[44px]">
                  {form.candidateName ? (
                    <>
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {form.candidateName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">
                          {form.candidateName}
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

              <Field>
                <FieldLabel>Hunter / Reclutador</FieldLabel>
                <Input
                  value={form.hunterName}
                  onChange={(e) => updateField("hunterName", e.target.value)}
                  placeholder="Nombre del reclutador"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Mes de Placement</FieldLabel>
              <Input
                type="month"
                value={form.mesPlacement}
                onChange={(e) => updateField("mesPlacement", e.target.value)}
              />
            </Field>
          </fieldset>

          {/* ── Section: Datos Financieros ────────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Datos Financieros
            </legend>

            {/* Currency */}
            <Field>
              <FieldLabel>Moneda *</FieldLabel>
              <Select
                value={form.currency}
                onValueChange={(v) => updateField("currency", v)}
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

            {/* Fee fields — shown for ALL types */}
            <Field data-invalid={!!errors.salario}>
              <FieldLabel>Sueldo *</FieldLabel>
              <CurrencyInput
                value={form.salario ?? ""}
                onChange={(v) =>
                  updateField("salario", v === "" ? null : parseFloat(v))
                }
                prefix={form.currency === "USD" ? "USD $ " : "$ "}
                placeholder="0"
              />
              {errors.salario && (
                <FieldError>{errors.salario}</FieldError>
              )}
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field data-invalid={!!errors.feeType}>
                <FieldLabel>Tipo de Fee *</FieldLabel>
                <Select
                  value={form.feeType || "none"}
                  onValueChange={(v) =>
                    updateField("feeType", v === "none" ? "" : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de fee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Seleccionar tipo</SelectItem>
                    {Object.entries(FeeTypeLabels).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                {errors.feeType && (
                  <FieldError>{errors.feeType}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.feeValue}>
                <FieldLabel>
                  {form.feeType === "PERCENTAGE"
                    ? "Porcentaje de Fee *"
                    : form.feeType === "MONTHS"
                      ? "Meses de Sueldo *"
                      : "Monto de Fee *"}
                </FieldLabel>
                {form.feeType === "PERCENTAGE" ? (
                  <PercentInput
                    value={form.feeValue ?? ""}
                    onChange={(v) =>
                      updateField(
                        "feeValue",
                        v === "" ? null : parseFloat(v),
                      )
                    }
                    placeholder="0"
                  />
                ) : form.feeType === "MONTHS" ? (
                  <NumericFormat
                    customInput={Input}
                    value={form.feeValue ?? ""}
                    decimalScale={1}
                    decimalSeparator="."
                    allowNegative={false}
                    suffix=" meses"
                    placeholder="0 meses"
                    onValueChange={({ floatValue }) =>
                      updateField("feeValue", floatValue ?? null)
                    }
                  />
                ) : (
                  <CurrencyInput
                    value={form.feeValue ?? ""}
                    onChange={(v) =>
                      updateField(
                        "feeValue",
                        v === "" ? null : parseFloat(v),
                      )
                    }
                    prefix={form.currency === "USD" ? "USD $ " : "$ "}
                    placeholder="0"
                  />
                )}
                {errors.feeValue && (
                  <FieldError>{errors.feeValue}</FieldError>
                )}
              </Field>
            </div>

            {/* Advance fields — ANTICIPO only */}
            {isAnticipo && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field data-invalid={!!errors.advanceType}>
                  <FieldLabel>Tipo de Anticipo *</FieldLabel>
                  <Select
                    value={form.advanceType || "none"}
                    onValueChange={(v) =>
                      updateField("advanceType", v === "none" ? "" : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de anticipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Seleccionar tipo
                      </SelectItem>
                      {Object.entries(AdvanceTypeLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  {errors.advanceType && (
                    <FieldError>{errors.advanceType}</FieldError>
                  )}
                </Field>

                <Field data-invalid={!!errors.advanceValue}>
                  <FieldLabel>
                    {form.advanceType === "PERCENTAGE"
                      ? "Porcentaje de Anticipo *"
                      : "Monto de Anticipo *"}
                  </FieldLabel>
                  {form.advanceType === "PERCENTAGE" ? (
                    <PercentInput
                      value={form.advanceValue ?? ""}
                      onChange={(v) =>
                        updateField(
                          "advanceValue",
                          v === "" ? null : parseFloat(v),
                        )
                      }
                      placeholder="0"
                    />
                  ) : (
                    <CurrencyInput
                      value={form.advanceValue ?? ""}
                      onChange={(v) =>
                        updateField(
                          "advanceValue",
                          v === "" ? null : parseFloat(v),
                        )
                      }
                      prefix={form.currency === "USD" ? "USD $ " : "$ "}
                      placeholder="0"
                    />
                  )}
                  {errors.advanceValue && (
                    <FieldError>{errors.advanceValue}</FieldError>
                  )}
                </Field>
              </div>
            )}

            {/* Anticipo info for LIQUIDACION */}
            {isLiquidacion && invoice.anticipoFolio && (
              <div className="rounded-md border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Anticipo vinculado:
                  </span>
                  <span className="font-medium">{invoice.anticipoFolio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Monto deducido:
                  </span>
                  <span className="font-bold text-blue-700 dark:text-blue-300">
                    ${invoice.anticipoDeduccion.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            )}

            {/* Live calculation preview — shown for ALL types */}
            <InvoiceCalculationPreview
              type={invoice.type}
              currency={form.currency}
              feeType={form.feeType || null}
              feeValue={form.feeValue}
              salario={form.salario}
              advanceType={form.advanceType || null}
              advanceValue={form.advanceValue}
              anticipoTotal={invoice.anticipoTotal ?? null}
            />
          </fieldset>

          {/* ── Section: Datos de Factura ─────────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Datos de Factura
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field data-invalid={!!errors.issuedAt}>
                <FieldLabel>Fecha de Emisión *</FieldLabel>
                <DatePicker
                  value={form.issuedAt}
                  onChange={(date) => updateField("issuedAt", date)}
                  placeholder="Seleccionar fecha"
                />
                {errors.issuedAt && (
                  <FieldError>{errors.issuedAt}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Banco</FieldLabel>
                <Input
                  value={form.banco}
                  onChange={(e) => updateField("banco", e.target.value)}
                  placeholder="Banco receptor"
                />
              </Field>
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
                disabled={
                  updateStatusMutation.isPending ||
                  (isPPD && !invoice.hasComplemento)
                }
                onClick={handleMarkAsPaid}
                className="w-full"
              >
                {updateStatusMutation.isPending
                  ? "Actualizando..."
                  : "Marcar como Pagada"}
              </Button>
            </fieldset>
          )}

          {/* ── Submit ─────────────────────────────────────────────────── */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateInvoiceMutation.isPending}
            >
              Cerrar
            </Button>
            <LoadingButton
              type="submit"
              isLoading={updateInvoiceMutation.isPending}
              loadingText="Guardando..."
            >
              Guardar cambios
            </LoadingButton>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
