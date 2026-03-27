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
import { SearchableSelect } from "@/core/shared/components/SearchableSelect";
import { useClientsListQuery } from "@/features/Finanzas/Clientes/frontend/hooks/useClient";
import { useCreateInvoice } from "../hooks/useCreateInvoice";
import { useInvoiceVacancyOptions } from "../hooks/useInvoiceVacancyOptions";
import { AnticipoSelector } from "./AnticipoSelector";
import { InvoiceCalculationPreview } from "./InvoiceCalculationPreview";
import {
  InvoiceTypeLabels,
  InvoicePaymentTypeLabels,
  FeeTypeLabels,
  CurrencyLabels,
  AdvanceTypeLabels,
} from "../types/invoice.types";
import type {
  InvoiceType,
  InvoicePaymentType,
  Currency,
  FeeType,
} from "../types/invoice.types";
import type { CreateInvoiceActionInput } from "../../server/presentation/actions/createInvoice.action";
import type { InvoiceVacancyOption } from "../../server/presentation/actions/getInvoiceVacancyOptions.action";
import type { ClientDTO } from "@/features/Finanzas/Clientes/frontend/types/client.types";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import { DatePicker } from "@/core/shared/ui/shadcn/date-picker";

// ── Initial form state ──────────────────────────────────────────────────────

interface InvoiceFormState {
  // Invoice type
  type: string;
  paymentType: string;
  // Relations
  clientId: string;
  vacancyId: string;
  anticipoInvoiceId: string;
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
  // Anticipo derived
  anticipoTotal: number | null;
}

const initialFormState: InvoiceFormState = {
  type: "FULL",
  paymentType: "PUE",
  clientId: "",
  vacancyId: "",
  anticipoInvoiceId: "",
  candidateId: "",
  candidateName: "",
  hunterId: "",
  hunterName: "",
  razonSocial: "",
  nombreComercial: "",
  ubicacion: "",
  figura: "",
  rfc: "",
  codigoPostal: "",
  regimen: "",
  posicion: "",
  currency: "MXN",
  salario: null,
  feeType: "",
  feeValue: null,
  advanceType: "",
  advanceValue: null,
  issuedAt: new Date().toISOString().split("T")[0],
  mesPlacement: "",
  banco: "",
  anticipoTotal: null,
};

function toMonthValue(dateIso: string | null): string {
  if (!dateIso) return "";

  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "";

  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${year}-${month}`;
}

// ── Validation errors ───────────────────────────────────────────────────────

interface FormErrors {
  [key: string]: string | undefined;
}

// ── Component ───────────────────────────────────────────────────────────────

interface CreateInvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInvoiceSheet({
  open,
  onOpenChange,
}: CreateInvoiceSheetProps) {
  const [form, setForm] = useState<InvoiceFormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const isMobile = useIsMobile();

  const { data: clients = [] } = useClientsListQuery();
  const { data: rawVacancyOptions = [] } = useInvoiceVacancyOptions(
    form.clientId ? form.clientId : undefined,
  );
  const createInvoiceMutation = useCreateInvoice();

  // ── Client options for SearchableSelect ─────────────────────────────────

  const clientOptions = useMemo(
    () =>
      clients.map((c: ClientDTO) => ({
        value: c.id,
        label: c.nombreComercial || c.nombre,
        nombre: c.nombre,
      })),
    [clients],
  );

  // ── Derived state ─────────────────────────────────────────────────────────

  const isAnticipo = form.type === "ANTICIPO";
  const isLiquidacion = form.type === "LIQUIDACION";
  const requiresVacancy = true; // All three types require vacancy
  const requiresFee = true; // All three types require fee

  const selectedClient = useMemo(
    () => clients.find((c: ClientDTO) => c.id === form.clientId),
    [clients, form.clientId],
  );

  const selectedVacancy = useMemo(
    () => rawVacancyOptions.find((vacancy) => vacancy.id === form.vacancyId),
    [rawVacancyOptions, form.vacancyId],
  );

  const vacancyOptions = useMemo(
    () =>
      rawVacancyOptions.map((vacancy: InvoiceVacancyOption) => ({
        value: vacancy.id,
        label: `${vacancy.position}${vacancy.isWarranty ? " (Garantía)" : ""}`,
        ...vacancy,
      })),
    [rawVacancyOptions],
  );

  const clientHasNoFee = selectedClient
    ? !selectedClient.feeType || !selectedClient.feeValue
    : false;

  // ── Form field updater ────────────────────────────────────────────────────

  const updateField = useCallback(
    <K extends keyof InvoiceFormState>(key: K, value: InvoiceFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      // Clear error for this field
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

  // ── Client selection auto-fill ────────────────────────────────────────────

  const handleClientChange = useCallback(
    (clientId: string) => {
      const client = clients.find((c: ClientDTO) => c.id === clientId);
      if (!client) return;

      setForm((prev) => ({
        ...prev,
        clientId,
        // Auto-fill fiscal data
        razonSocial: client.nombre ?? "",
        nombreComercial: client.nombreComercial ?? "",
        ubicacion: client.ubicacion ?? "",
        figura: client.figura ?? "",
        rfc: client.rfc ?? "",
        codigoPostal: client.codigoPostalFiscal ?? "",
        regimen: client.regimenFiscal ?? "",
        // Auto-fill commercial terms
        currency: client.currency ?? "MXN",
        feeType: client.feeType ?? "",
        feeValue: client.feeValue ?? null,
        // Auto-fill advance terms
        advanceType: client.advanceType ?? "",
        advanceValue: client.advanceValue ?? null,
        // Reset vacancy selection when client changes
        vacancyId: "",
        posicion: "",
        salario: null,
        candidateId: "",
        candidateName: "",
        hunterId: "",
        hunterName: "",
        mesPlacement: "",
        anticipoInvoiceId: "",
        anticipoTotal: null,
      }));

      setErrors({});
    },
    [clients],
  );

  // ── Type change handler ───────────────────────────────────────────────────

  const handleTypeChange = useCallback(
    (newType: string) => {
      setForm((prev) => ({
        ...prev,
        type: newType,
        // Reset type-specific fields
        vacancyId: "",
        posicion: "",
        salario: null,
        candidateId: "",
        candidateName: "",
        hunterId: "",
        hunterName: "",
        mesPlacement: "",
        anticipoInvoiceId: "",
        anticipoTotal: null,
      }));
      setErrors({});
    },
    [],
  );

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!form.clientId) {
      newErrors.clientId = "Cliente es requerido";
    }

    if (!form.razonSocial.trim()) {
      newErrors.razonSocial = "Razón social es requerida";
    }

    if (!form.issuedAt) {
      newErrors.issuedAt = "Fecha de emisión es requerida";
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

    if (requiresVacancy) {
      if (!form.vacancyId) {
        newErrors.vacancyId = "Debe seleccionar una vacante";
      }
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

    if (isLiquidacion) {
      if (!form.anticipoInvoiceId) {
        newErrors.anticipoInvoiceId = "Debe seleccionar una factura de anticipo";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, isAnticipo, isLiquidacion, requiresVacancy, requiresFee]);

  const handleVacancyChange = useCallback(
    (vacancyId: string) => {
      const vacancy = rawVacancyOptions.find((option) => option.id === vacancyId);
      if (!vacancy) return;

      setForm((prev) => ({
        ...prev,
        vacancyId,
        posicion: vacancy.position,
        salario: vacancy.salaryFixed ?? prev.salario,
        hunterId: vacancy.recruiterId,
        hunterName: vacancy.recruiterName,
        // Usar datos del candidato contratado vía FK directa
        candidateId: vacancy.hiredCandidateId ?? "",
        candidateName: vacancy.hiredCandidateName ?? "",
        mesPlacement: toMonthValue(vacancy.mesPlacement),
      }));

      setErrors((prev) => {
        const next = { ...prev };
        delete next.vacancyId;
        return next;
      });
    },
    [rawVacancyOptions],
  );

  // ── Submit handler ────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      const input: CreateInvoiceActionInput = {
        type: form.type as InvoiceType,
        paymentType: form.paymentType as InvoicePaymentType,
        clientId: form.clientId,
        vacancyId: form.vacancyId || null,
        anticipoInvoiceId: form.anticipoInvoiceId || null,
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
          : new Date().toISOString(),
        mesPlacement: form.mesPlacement
          ? new Date(form.mesPlacement + "T12:00:00").toISOString()
          : null,
        banco: form.banco || null,
      };

      await createInvoiceMutation.mutateAsync(input, {
        onSuccess: () => {
          setForm(initialFormState);
          setErrors({});
          onOpenChange(false);
        },
      });
    },
    [form, validate, createInvoiceMutation, onOpenChange],
  );

  // ── Close handler ─────────────────────────────────────────────────────────

  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setForm(initialFormState);
        setErrors({});
      }
      onOpenChange(isOpen);
    },
    [onOpenChange],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        width="2xl"
        side={isMobile ? "bottom" : "right"}
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B] overflow-y-auto p-0"
      >
        <SheetHeader className="p-4 pb-3 space-y-3">
          <SheetTitle className="text-xl font-semibold">Crear Factura</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Completa los datos para generar una nueva factura
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-4 pb-4">
          {/* ── Section 1: Tipo de Factura ──────────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Tipo de Factura
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Invoice Type */}
              <Field data-invalid={!!errors.type}>
                <FieldLabel>Tipo *</FieldLabel>
                <Select
                  value={form.type}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de factura" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(InvoiceTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <FieldError>{errors.type}</FieldError>}
              </Field>

              {/* Payment Type */}
              <Field>
                <FieldLabel>Tipo de Pago *</FieldLabel>
                <Select
                  value={form.paymentType}
                  onValueChange={(v) => updateField("paymentType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(InvoicePaymentTypeLabels).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* PPD info message */}
            {form.paymentType === "PPD" && (
              <div className="flex items-start gap-2 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-3 text-sm text-blue-700 dark:text-blue-300">
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  className="size-5 shrink-0 mt-0.5"
                />
                <span>
                  Las facturas PPD requieren subir un complemento de pago antes
                  de poder marcarlas como pagadas. El complemento se sube después
                  de crear la factura.
                </span>
              </div>
            )}
          </fieldset>

          {/* ── Section 2: Cliente ──────────────────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Cliente
            </legend>

            <Field data-invalid={!!errors.clientId}>
              <FieldLabel>Cliente *</FieldLabel>
              <SearchableSelect
                options={clientOptions}
                value={form.clientId}
                onChange={handleClientChange}
                placeholder="Seleccionar cliente..."
                searchPlaceholder="Buscar cliente..."
              />
              {errors.clientId && (
                <FieldError>{errors.clientId}</FieldError>
              )}
            </Field>

            {/* Warning banner if client has no fee */}
            {selectedClient && clientHasNoFee && requiresFee && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-700 dark:text-amber-300">
                <HugeiconsIcon
                  icon={Alert02Icon}
                  className="size-5 shrink-0 mt-0.5"
                />
                <span>
                  Este cliente no tiene fee configurado. Ingresa los datos de
                  fee manualmente.
                </span>
              </div>
            )}
          </fieldset>

          {/* ── Section 3: Datos Fiscales ───────────────────────────────── */}
          {form.clientId && (
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
                      updateField(
                        "rfc",
                        e.target.value.toUpperCase().slice(0, 13),
                      )
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
                      const val = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 5);
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
          )}

          {/* ── Section 4: Datos de Vacante (not for ANTICIPO) ─────────── */}
          {requiresVacancy && form.clientId && (
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Datos de Vacante
              </legend>

              <Field>
                <FieldLabel>Vacante *</FieldLabel>
                <SearchableSelect
                  options={vacancyOptions}
                  value={form.vacancyId}
                  onChange={handleVacancyChange}
                  placeholder="Seleccionar vacante..."
                  searchPlaceholder="Buscar vacante..."
                />
                {errors.vacancyId && <FieldError>{errors.vacancyId}</FieldError>}
              </Field>

              {selectedVacancy?.isWarranty && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-700 dark:text-amber-300">
                  <HugeiconsIcon
                    icon={Alert02Icon}
                    className="size-5 shrink-0 mt-0.5"
                  />
                  <span>
                    Esta vacante está marcada como garantía. Si intentás crear la
                    factura, el servidor la va a rechazar.
                  </span>
                </div>
              )}

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
                          {/* We could show email here if we had it in form state */}
                        </div>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Selecciona una vacante
                      </span>
                    )}
                  </div>
                </Field>

                <Field>
                  <FieldLabel>Hunter / Reclutador</FieldLabel>
                  <Input
                    value={form.hunterName}
                    onChange={(e) =>
                      updateField("hunterName", e.target.value)
                    }
                    placeholder="Nombre del reclutador"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel>Mes de Placement</FieldLabel>
                <Input
                  type="month"
                  value={form.mesPlacement}
                  onChange={(e) =>
                    updateField("mesPlacement", e.target.value)
                  }
                />
              </Field>
            </fieldset>
          )}

          {/* ── Section 5: Anticipo Selector (only LIQUIDACION) ────────── */}
          {isLiquidacion && form.clientId && (
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Anticipo Vinculado
              </legend>

              <Field data-invalid={!!errors.anticipoInvoiceId}>
                <FieldLabel>Factura de Anticipo *</FieldLabel>
                <AnticipoSelector
                  clientId={form.clientId}
                  value={form.anticipoInvoiceId || undefined}
                  onChange={(anticipoId, anticipoTotal) => {
                    setForm((prev) => ({
                      ...prev,
                      anticipoInvoiceId: anticipoId,
                      anticipoTotal,
                    }));
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.anticipoInvoiceId;
                      return next;
                    });
                  }}
                />
                {errors.anticipoInvoiceId && (
                  <FieldError>{errors.anticipoInvoiceId}</FieldError>
                )}
              </Field>
            </fieldset>
          )}

          {/* ── Section 6: Cálculo Financiero ──────────────────────────── */}
          {form.clientId && (
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
                    updateField(
                      "salario",
                      v === "" ? null : parseFloat(v),
                    )
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
                      <SelectItem value="none">
                        Seleccionar tipo
                      </SelectItem>
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
                <>
                  {/* Warning: client has no advance config */}
                  {selectedClient &&
                    !selectedClient.advanceType && (
                      <div className="flex items-start gap-2 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-3 text-sm text-blue-700 dark:text-blue-300">
                        <HugeiconsIcon
                          icon={InformationCircleIcon}
                          className="size-5 shrink-0 mt-0.5"
                        />
                        <span>
                          Este cliente no tiene anticipo configurado. Ingresa
                          los datos de anticipo manualmente.
                        </span>
                      </div>
                    )}

                  {/* Warning: client paymentScheme !== ADVANCE */}
                  {selectedClient &&
                    selectedClient.paymentScheme &&
                    selectedClient.paymentScheme !== "ADVANCE" && (
                      <div className="flex items-start gap-2 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-700 dark:text-amber-300">
                        <HugeiconsIcon
                          icon={Alert02Icon}
                          className="size-5 shrink-0 mt-0.5"
                        />
                        <span>
                          El esquema de cobro de este cliente no incluye
                          anticipo.
                        </span>
                      </div>
                    )}

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
                </>
              )}

              {/* Real-time calculation preview */}
              <InvoiceCalculationPreview
                type={form.type}
                currency={form.currency}
                feeType={form.feeType || null}
                feeValue={form.feeValue}
                salario={form.salario}
                advanceType={form.advanceType || null}
                advanceValue={form.advanceValue}
                anticipoTotal={form.anticipoTotal}
              />
            </fieldset>
          )}

          {/* ── Section 7: Datos de Factura ────────────────────────────── */}
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

          {/* ── Submit ─────────────────────────────────────────────────── */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={createInvoiceMutation.isPending}
            >
              Cancelar
            </Button>
            <LoadingButton
              type="submit"
              isLoading={createInvoiceMutation.isPending}
              loadingText="Creando..."
            >
              Crear Factura
            </LoadingButton>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
