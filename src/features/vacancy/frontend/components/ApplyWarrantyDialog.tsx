"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@shadcn/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/core/shared/ui/shadcn/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/select";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import { Textarea } from "@shadcn/textarea";
import { Switch } from "@shadcn/switch";
import { Spinner } from "@shadcn/spinner";
import { ScrollArea } from "@/core/shared/ui/shadcn/scroll-area";
import { Field, FieldLabel, FieldError } from "@/core/shared/ui/shadcn/field";
import { DatePicker } from "@/core/shared/ui/shadcn/date-picker";
import CountrySelect from "@/core/shared/components/CountrySelect";
import RegionSelect from "@/core/shared/components/RegionSelect";
import { SearchableSelect } from "@/core/shared/components/SearchableSelect";
import { CurrencyInput } from "@/core/shared/components/CurrencyInput";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/shared/ui/shadcn/avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { WorkSchedulePicker } from "./WorkSchedulePicker";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";
import {
  useCheckWarrantyEligibility,
  useCreateWarrantyVacancy,
} from "../hooks/useWarranty";
import {
  VACANCY_MODALITY_LABELS,
  VACANCY_STATUS_LABELS,
  VACANCY_SALARY_TYPE_LABELS,
  VACANCY_CURRENCY_LABELS,
} from "../types/vacancy.types";
import type {
  VacancyDTO,
  VacancyModality,
  VacancySalaryType,
  VacancyCurrency,
  VacancyStatusType,
  VacancyServiceType,
  CreateWarrantyVacancyInput,
  WarrantyEligibilityResult,
} from "../types/vacancy.types";
import { showToast } from "@/core/shared/components/ShowToast";

// ── Types ────────────────────────────────────────────────────────────────────

interface ApplyWarrantyDialogProps {
  vacancyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface WarrantyFormState {
  position: string;
  recruiterId: string;
  status: VacancyStatusType;
  assignedAt: string;
  targetDeliveryDate: string;
  salaryType: VacancySalaryType;
  salaryMin: number | undefined;
  salaryMax: number | undefined;
  salaryFixed: number | undefined;
  currency: VacancyCurrency | "";
  serviceType: VacancyServiceType;
  modality: VacancyModality | undefined;
  schedule: string;
  countryCode: string;
  regionCode: string;
  commissions: string;
  benefits: string;
  tools: string;
  requiresPsychometry: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const INITIAL_STATUS_OPTIONS: { value: VacancyStatusType; label: string }[] = [
  { value: "QUICK_MEETING", label: VACANCY_STATUS_LABELS.QUICK_MEETING },
  { value: "HUNTING", label: VACANCY_STATUS_LABELS.HUNTING },
];

function buildInitialFormState(
  prefillData?: Partial<VacancyDTO> | null,
): WarrantyFormState {
  const today = format(new Date(), "yyyy-MM-dd");
  if (!prefillData) {
    return {
      position: "",
      recruiterId: "",
      status: "HUNTING",
      assignedAt: today,
      targetDeliveryDate: "",
      salaryType: "RANGE",
      salaryMin: undefined,
      salaryMax: undefined,
      salaryFixed: undefined,
      currency: "",
      serviceType: "END_TO_END",
      modality: undefined,
      schedule: "",
      countryCode: "",
      regionCode: "",
      commissions: "",
      benefits: "",
      tools: "",
      requiresPsychometry: false,
    };
  }
  return {
    position: prefillData.position ?? "",
    recruiterId: prefillData.recruiterId ?? "",
    status: "HUNTING",
    assignedAt: today,
    targetDeliveryDate: "",
    salaryType: (prefillData.salaryType as VacancySalaryType) ?? "RANGE",
    salaryMin: prefillData.salaryMin ?? undefined,
    salaryMax: prefillData.salaryMax ?? undefined,
    salaryFixed: prefillData.salaryFixed ?? undefined,
    currency: (prefillData.currency as VacancyCurrency) ?? "",
    serviceType:
      (prefillData.serviceType as VacancyServiceType) ?? "END_TO_END",
    modality: (prefillData.modality as VacancyModality) ?? undefined,
    schedule: prefillData.schedule ?? "",
    countryCode: prefillData.countryCode ?? "",
    regionCode: prefillData.regionCode ?? "",
    commissions: prefillData.commissions ?? "",
    benefits: prefillData.benefits ?? "",
    tools: prefillData.tools ?? "",
    requiresPsychometry: prefillData.requiresPsychometry ?? false,
  };
}

// ── Inner form (receives pre-built state, no effects) ────────────────────────

interface WarrantyFormContentProps {
  vacancyId: string;
  eligibility: WarrantyEligibilityResult;
  initialState: WarrantyFormState;
  onClose: () => void;
}

function WarrantyFormContent({
  vacancyId,
  eligibility,
  initialState,
  onClose,
}: WarrantyFormContentProps) {
  const createWarrantyMutation = useCreateWarrantyVacancy();
  const { data: users = [] } = useTenantUsersQuery();

  const [form, setForm] = useState<WarrantyFormState>(initialState);

  const updateField = useCallback(
    <K extends keyof WarrantyFormState>(key: K, value: WarrantyFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: u.name ?? u.email,
        avatar: u.avatar,
      })),
    [users],
  );

  const handleSubmit = async () => {
    if (!form.position.trim()) {
      showToast({
        type: "error",
        title: "Campo requerido",
        description: "La posición es requerida",
      });
      return;
    }
    if (!form.recruiterId) {
      showToast({
        type: "error",
        title: "Campo requerido",
        description: "El reclutador es requerido",
      });
      return;
    }

    const input: CreateWarrantyVacancyInput = {
      originVacancyId: vacancyId,
      position: form.position.trim(),
      recruiterId: form.recruiterId,
      serviceType: form.serviceType || undefined,
      currency: form.currency || undefined,
      salaryType: form.salaryType,
      salaryMin:
        form.salaryType === "RANGE" ? form.salaryMin ?? null : null,
      salaryMax:
        form.salaryType === "RANGE" ? form.salaryMax ?? null : null,
      salaryFixed:
        form.salaryType === "FIXED" ? form.salaryFixed ?? null : null,
      commissions: form.commissions || null,
      benefits: form.benefits || null,
      tools: form.tools || null,
      modality: form.modality ?? null,
      schedule: form.schedule || null,
      countryCode: form.countryCode || null,
      regionCode: form.regionCode || null,
      requiresPsychometry: form.requiresPsychometry,
      targetDeliveryDate: form.targetDeliveryDate || null,
    };

    await createWarrantyMutation.mutateAsync(input);
    onClose();
  };

  return (
    <>
      <ScrollArea className="max-h-[60vh] pr-4">
        <div className="space-y-4 pb-2">
          {/* Expired warranty warning banner */}
          {eligibility.expired && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3">
              <HugeiconsIcon
                icon={Alert02Icon}
                size={16}
                className="text-amber-600 shrink-0"
              />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                El período de garantía ha expirado. La vacante se creará
                igualmente por confirmación del usuario.
              </p>
            </div>
          )}

          {/* Posición */}
          <Field>
            <FieldLabel>Posición *</FieldLabel>
            <Input
              value={form.position}
              onChange={(e) => updateField("position", e.target.value)}
              placeholder="Ej. Desarrollador Senior"
            />
            {!form.position.trim() && (
              <FieldError>La posición es requerida</FieldError>
            )}
          </Field>

          {/* Estado inicial */}
          <Field>
            <FieldLabel>Estado inicial</FieldLabel>
            <Select
              value={form.status}
              onValueChange={(v) =>
                updateField("status", v as VacancyStatusType)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                {INITIAL_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Reclutador */}
          <Field>
            <FieldLabel>Reclutador *</FieldLabel>
            <SearchableSelect
              options={userOptions}
              value={form.recruiterId}
              onChange={(v) => updateField("recruiterId", v)}
              placeholder="Selecciona el reclutador"
              searchPlaceholder="Buscar reclutador..."
              renderOption={(opt) => (
                <>
                  <Avatar className="size-6">
                    <AvatarImage src={opt.avatar ?? ""} />
                    <AvatarFallback className="text-xs">U</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{opt.label}</span>
                </>
              )}
              renderSelected={(opt) => (
                <span className="flex items-center gap-2 truncate">
                  <Avatar className="size-6">
                    <AvatarImage src={opt.avatar ?? ""} />
                    <AvatarFallback className="text-xs">U</AvatarFallback>
                  </Avatar>
                  {opt.label}
                </span>
              )}
            />
          </Field>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Fecha de asignación</FieldLabel>
              <DatePicker
                value={form.assignedAt}
                onChange={(v) => updateField("assignedAt", v)}
                placeholder="Seleccionar fecha"
              />
            </Field>
            <Field>
              <FieldLabel>Fecha máxima de entrega</FieldLabel>
              <DatePicker
                value={form.targetDeliveryDate}
                onChange={(v) => updateField("targetDeliveryDate", v)}
                placeholder="Seleccionar fecha"
              />
            </Field>
          </div>

          {/* Moneda */}
          <Field>
            <FieldLabel>Moneda</FieldLabel>
            <Select
              value={form.currency || "none"}
              onValueChange={(v) =>
                updateField(
                  "currency",
                  v === "none" ? "" : (v as VacancyCurrency),
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la moneda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin moneda</SelectItem>
                {(
                  Object.entries(VACANCY_CURRENCY_LABELS) as [
                    VacancyCurrency,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Tipo de salario */}
          <Field>
            <FieldLabel>Tipo de salario</FieldLabel>
            <Select
              value={form.salaryType}
              onValueChange={(v) =>
                updateField("salaryType", v as VacancySalaryType)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de salario" />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(VACANCY_SALARY_TYPE_LABELS) as [
                    VacancySalaryType,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Salary fields */}
          {form.salaryType === "FIXED" ? (
            <Field>
              <FieldLabel>Salario fijo</FieldLabel>
              <CurrencyInput
                value={form.salaryFixed ?? ""}
                onChange={(value) =>
                  updateField(
                    "salaryFixed",
                    value ? Number(value) : undefined,
                  )
                }
              />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Salario mínimo</FieldLabel>
                <CurrencyInput
                  value={form.salaryMin ?? ""}
                  onChange={(value) =>
                    updateField(
                      "salaryMin",
                      value ? Number(value) : undefined,
                    )
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Salario máximo</FieldLabel>
                <CurrencyInput
                  value={form.salaryMax ?? ""}
                  onChange={(value) =>
                    updateField(
                      "salaryMax",
                      value ? Number(value) : undefined,
                    )
                  }
                />
              </Field>
            </div>
          )}

          {/* Modalidad */}
          <Field>
            <FieldLabel>Modalidad</FieldLabel>
            <Select
              value={form.modality ?? "none"}
              onValueChange={(v) =>
                updateField(
                  "modality",
                  v === "none" ? undefined : (v as VacancyModality),
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la modalidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin modalidad</SelectItem>
                {(
                  Object.entries(VACANCY_MODALITY_LABELS) as [
                    VacancyModality,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Horario */}
          <Field>
            <FieldLabel>Horario</FieldLabel>
            <WorkSchedulePicker
              value={form.schedule || undefined}
              onChange={(v) => updateField("schedule", v)}
            />
          </Field>

          {/* País y Región */}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>País</FieldLabel>
              <CountrySelect
                className="w-full"
                value={form.countryCode}
                onChange={(value) => {
                  updateField("countryCode", value);
                  updateField("regionCode", "");
                }}
                priorityOptions={["MX"]}
                placeholder="Seleccionar país"
              />
            </Field>
            <Field>
              <FieldLabel>Estado / Región</FieldLabel>
              <RegionSelect
                className="w-full"
                value={form.regionCode}
                countryCode={form.countryCode}
                onChange={(v) => updateField("regionCode", v)}
                placeholder="Seleccionar región"
              />
            </Field>
          </div>

          {/* Comisiones */}
          <Field>
            <FieldLabel>Comisiones / Bonos</FieldLabel>
            <Textarea
              value={form.commissions}
              onChange={(e) => updateField("commissions", e.target.value)}
              placeholder="Describe las comisiones o bonos..."
              rows={2}
            />
          </Field>

          {/* Beneficios */}
          <Field>
            <FieldLabel>Prestaciones</FieldLabel>
            <Textarea
              value={form.benefits}
              onChange={(e) => updateField("benefits", e.target.value)}
              placeholder="Seguro médico, vales de despensa, etc."
              rows={2}
            />
          </Field>

          {/* Herramientas */}
          <Field>
            <FieldLabel>Herramientas</FieldLabel>
            <Textarea
              value={form.tools}
              onChange={(e) => updateField("tools", e.target.value)}
              placeholder="Celular, Laptop, etc."
              rows={2}
            />
          </Field>

          {/* Requiere Psicometría */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel className="cursor-pointer">
                Requiere Psicometría
              </FieldLabel>
              <Switch
                checked={form.requiresPsychometry}
                onCheckedChange={(v) =>
                  updateField("requiresPsychometry", v)
                }
              />
            </div>
          </Field>
        </div>
      </ScrollArea>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={createWarrantyMutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createWarrantyMutation.isPending}
        >
          {createWarrantyMutation.isPending
            ? "Creando..."
            : "Aplicar garantía"}
        </Button>
      </DialogFooter>
    </>
  );
}

// ── Outer dialog (manages eligibility check + expiry confirmation) ────────────

export function ApplyWarrantyDialog({
  vacancyId,
  open,
  onOpenChange,
}: ApplyWarrantyDialogProps) {
  const {
    data: eligibilityResult,
    isLoading: isCheckingEligibility,
    error: eligibilityError,
  } = useCheckWarrantyEligibility(open ? vacancyId : null);

  const eligibility = eligibilityResult?.eligibility;

  // Expiry confirmation — managed at this level to gate form rendering
  const [expiryConfirmed, setExpiryConfirmed] = useState(false);

  // Track whether the expiry AlertDialog is open separately to avoid closure race conditions
  const [expiryAlertOpen, setExpiryAlertOpen] = useState(false);

  // Derive expiry warning: show when eligible + expired + not yet confirmed
  const shouldShowExpiryWarning =
    !!eligibility?.eligible && !!eligibility?.expired && !expiryConfirmed;

  // Open the alert dialog when expiry warning conditions are met
  useEffect(() => {
    if (shouldShowExpiryWarning) {
      setExpiryAlertOpen(true);
    }
  }, [shouldShowExpiryWarning]);

  // Derive states
  const isNotEligible =
    !isCheckingEligibility &&
    !eligibilityError &&
    !!eligibility &&
    !eligibility.eligible;

  const showForm =
    !isCheckingEligibility &&
    !eligibilityError &&
    !!eligibility?.eligible &&
    (!eligibility.expired || expiryConfirmed);

  // Compute initial form state from prefill data (derived, no effect needed)
  const initialFormState = useMemo(
    () => buildInitialFormState(eligibility?.prefillData),
    [eligibility?.prefillData],
  );

  const handleClose = useCallback(() => {
    setExpiryConfirmed(false);
    setExpiryAlertOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) handleClose();
        }}
      >
        <DialogContent className="md:min-w-2xl w-full max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Aplicar Garantía</DialogTitle>
            <DialogDescription>
              Crea una nueva vacante de garantía basada en la vacante original.
            </DialogDescription>
          </DialogHeader>

          {/* Loading state */}
          {isCheckingEligibility && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Spinner className="size-8" />
              <p className="text-sm text-muted-foreground">
                Verificando elegibilidad...
              </p>
            </div>
          )}

          {/* Error state */}
          {eligibilityError && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <HugeiconsIcon
                icon={Alert02Icon}
                size={32}
                className="text-destructive"
              />
              <p className="text-sm text-destructive">
                {eligibilityError.message}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
              >
                Cerrar
              </Button>
            </div>
          )}

          {/* Not eligible state */}
          {isNotEligible && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <HugeiconsIcon
                icon={Alert02Icon}
                size={32}
                className="text-amber-500"
              />
              <p className="text-sm font-medium">
                No es posible aplicar garantía
              </p>
              <p className="text-sm text-muted-foreground">
                {eligibility?.errorMessage ??
                  "Esta vacante no cumple los requisitos para aplicar garantía."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
              >
                Cerrar
              </Button>
            </div>
          )}

          {/* Form — keyed on prefillData to reset when data changes */}
          {showForm && eligibility && (
            <WarrantyFormContent
              key={vacancyId}
              vacancyId={vacancyId}
              eligibility={eligibility}
              initialState={initialFormState}
              onClose={handleClose}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Expiry warning AlertDialog — managed with its own open state to avoid
          the race condition where AlertDialogAction's auto-close triggers
          onOpenChange(false) before setExpiryConfirmed(true) re-renders */}
      <AlertDialog
        open={expiryAlertOpen}
        onOpenChange={(o) => {
          if (!o) {
            setExpiryAlertOpen(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Período de garantía expirado</AlertDialogTitle>
            <AlertDialogDescription>
              El período de garantía de{" "}
              <strong>{eligibility?.warrantyMonths} meses</strong> ya venció
              {eligibility?.expiryDate && (
                <>
                  {" "}
                  el{" "}
                  <strong>
                    {new Date(eligibility.expiryDate).toLocaleDateString(
                      "es-MX",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </strong>
                </>
              )}
              . ¿Deseas aplicar la garantía igualmente?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setExpiryAlertOpen(false);
                handleClose();
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setExpiryConfirmed(true);
                setExpiryAlertOpen(false);
              }}
            >
              Sí, aplicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
