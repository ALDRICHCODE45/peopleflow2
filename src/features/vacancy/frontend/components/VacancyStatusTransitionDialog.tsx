"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@shadcn/dialog";
import { Button } from "@shadcn/button";
import { Switch } from "@shadcn/switch";
import { CurrencyInput } from "@/core/shared/components/CurrencyInput";
import { Textarea } from "@shadcn/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/select";
import { Field, FieldLabel, FieldError } from "@/core/shared/ui/shadcn/field";
import { DatePicker } from "@/core/shared/ui/shadcn/date-picker";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { VacancyStatusBadge } from "./VacancyStatusBadge";
import { useTransitionVacancyStatus } from "../hooks/useVacancyDetailMutations";
import {
  VACANCY_STATUS_LABELS,
  VACANCY_SALARY_TYPE_LABELS,
  VALID_TRANSITIONS,
  type VacancyStatusType,
  type VacancySalaryType,
  type VacancyCandidateDTO,
} from "../types/vacancy.types";

interface VacancyStatusTransitionDialogProps {
  open: boolean;
  onClose: () => void;
  vacancyId: string;
  currentStatus: VacancyStatusType;
  candidates?: VacancyCandidateDTO[];
  vacancySalaryType?: VacancySalaryType;
  vacancySalaryFixed?: number | null;
  vacancyEntryDate?: string | null;
  /** Pre-select a target status when the dialog opens (e.g. from "Confirmar Placement" button) */
  initialStatus?: VacancyStatusType;
}

export function VacancyStatusTransitionDialog({
  open,
  onClose,
  vacancyId,
  currentStatus,
  candidates,
  vacancySalaryType,
  vacancySalaryFixed,
  vacancyEntryDate,
  initialStatus,
}: VacancyStatusTransitionDialogProps) {
  // Compute initial values — when initialStatus is PLACEMENT from PRE_PLACEMENT, pre-populate salary/date
  const preloadPlacement =
    initialStatus === "PLACEMENT" && currentStatus === "PRE_PLACEMENT";

  const [newStatus, setNewStatus] = useState<VacancyStatusType | "">(initialStatus ?? "");
  const [reason, setReason] = useState("");
  const [newTargetDeliveryDate, setNewTargetDeliveryDate] = useState("");
  const [salaryFixed, setSalaryFixed] = useState(
    preloadPlacement && vacancySalaryFixed != null && vacancySalaryFixed > 0
      ? String(vacancySalaryFixed)
      : "",
  );
  const [entryDate, setEntryDate] = useState(
    preloadPlacement && vacancyEntryDate ? vacancyEntryDate.split("T")[0] : "",
  );
  const [sendCongratsEmail, setSendCongratsEmail] = useState(false);
  const [hiredCandidateId, setHiredCandidateId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const transitionMutation = useTransitionVacancyStatus();

  const availableStatuses = VALID_TRANSITIONS[currentStatus] ?? [];

  // Determine transition type
  const isPrePlacement = newStatus === "PRE_PLACEMENT";
  const isPlacementFromFollowUp =
    newStatus === "PLACEMENT" && currentStatus === "FOLLOW_UP";
  const isPlacementFromPrePlacement =
    newStatus === "PLACEMENT" && currentStatus === "PRE_PLACEMENT";
  const isRollbackToHunting =
    newStatus === "HUNTING" &&
    (currentStatus === "FOLLOW_UP" ||
      currentStatus === "PRE_PLACEMENT" ||
      currentStatus === "PLACEMENT");
  const isTerminal =
    newStatus === "STAND_BY" ||
    newStatus === "CANCELADA" ||
    newStatus === "PERDIDA";

  const isFixedSalary = vacancySalaryType === "FIXED";
  const needsSalaryAndDate = isPrePlacement || isPlacementFromFollowUp || isPlacementFromPrePlacement;
  const needsHiredCandidate = isPrePlacement || isPlacementFromFollowUp || isPlacementFromPrePlacement;
  const needsReason = isRollbackToHunting || isTerminal;
  const needsNewTargetDate = isRollbackToHunting;
  const showCongratsSwitch = isPlacementFromFollowUp || isPlacementFromPrePlacement;

  // Today as ISO date string YYYY-MM-DD
  const today = new Date().toISOString().split("T")[0];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (needsSalaryAndDate) {
      if (!isFixedSalary && (!salaryFixed || Number(salaryFixed) <= 0)) {
        newErrors.salaryFixed = "Ingresá el salario final";
      }
      if (!entryDate) {
        newErrors.entryDate = "Ingresá la fecha de ingreso";
      }
    }
    if (needsHiredCandidate) {
      const ternaOrAll = (candidates ?? []).filter(
        (c) => c.isInTerna || c.status === "EN_TERNA",
      );
      const availableCandidates =
        ternaOrAll.length > 0 ? ternaOrAll : (candidates ?? []);
      if (availableCandidates.length > 0 && !hiredCandidateId) {
        newErrors.hiredCandidateId = "Seleccioná el candidato contratado";
      }
    }
    if (needsReason && !reason.trim()) {
      newErrors.reason = "El motivo es requerido";
    }
    if (needsNewTargetDate && !newTargetDeliveryDate) {
      newErrors.newTargetDeliveryDate = "La nueva fecha es requerida";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStatusChange = (value: string) => {
    const status = value as VacancyStatusType;
    setNewStatus(status);
    setErrors({});

    // Pre-populate salary/date when selecting PLACEMENT from PRE_PLACEMENT
    if (status === "PLACEMENT" && currentStatus === "PRE_PLACEMENT") {
      if (vacancySalaryFixed != null && vacancySalaryFixed > 0) {
        setSalaryFixed(String(vacancySalaryFixed));
      }
      if (vacancyEntryDate) {
        setEntryDate(vacancyEntryDate.split("T")[0]);
      }
    }
  };

  const handleSubmit = async () => {
    if (!newStatus || !validate()) return;

    await transitionMutation.mutateAsync({
      vacancyId,
      newStatus,
      reason: reason.trim() || undefined,
      newTargetDeliveryDate: newTargetDeliveryDate || undefined,
      salaryFixed: isFixedSalary ? undefined : (salaryFixed ? Number(salaryFixed) : undefined),
      entryDate: entryDate || undefined,
      sendCongratsEmail: sendCongratsEmail || undefined,
      hiredCandidateId: hiredCandidateId || undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setNewStatus("");
    setReason("");
    setNewTargetDeliveryDate("");
    setSalaryFixed("");
    setEntryDate("");
    setSendCongratsEmail(false);
    setHiredCandidateId("");
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cambiar estado de la vacante</DialogTitle>
          <DialogDescription>
            Seleccioná el nuevo estado y completá los campos requeridos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Estado actual */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Estado actual:</span>
            <VacancyStatusBadge status={currentStatus} />
          </div>

          {/* Nuevo estado */}
          <Field>
            <FieldLabel>
              Nuevo estado <span className="text-destructive">*</span>
            </FieldLabel>
            <Select value={newStatus} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar nuevo estado" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {VACANCY_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* ── PRE_PLACEMENT or PLACEMENT: salary + date ── */}
          {needsSalaryAndDate && (
            <>
              {/* Candidate hired selector (only for PRE_PLACEMENT or PLACEMENT from FOLLOW_UP) */}
              {needsHiredCandidate && (() => {
                const ternaOrAll = (candidates ?? []).filter(
                  (c) => c.isInTerna || c.status === "EN_TERNA",
                );
                const availableCandidates =
                  ternaOrAll.length > 0 ? ternaOrAll : (candidates ?? []);
                if (availableCandidates.length === 0) return null;
                return (
                  <Field>
                    <FieldLabel>
                      Candidato contratado{" "}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={hiredCandidateId}
                      onValueChange={(val) => {
                        setHiredCandidateId(val);
                        if (errors.hiredCandidateId)
                          setErrors((prev) => ({
                            ...prev,
                            hiredCandidateId: "",
                          }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar candidato contratado" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCandidates.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.firstName} {c.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.hiredCandidateId && (
                      <FieldError>{errors.hiredCandidateId}</FieldError>
                    )}
                  </Field>
                );
              })()}

              {isFixedSalary ? (
                <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  <HugeiconsIcon
                    icon={InformationCircleIcon}
                    className="mt-0.5 size-4 shrink-0"
                  />
                  <span>
                    El salario {VACANCY_SALARY_TYPE_LABELS.FIXED.toLowerCase()} ya fue definido: ${vacancySalaryFixed?.toLocaleString() ?? 0}
                  </span>
                </div>
              ) : (
                <Field>
                  <FieldLabel>
                    Salario final acordado <span className="text-destructive">*</span>
                  </FieldLabel>
                  <CurrencyInput
                    value={salaryFixed}
                    onChange={(value) => {
                      setSalaryFixed(value);
                      if (errors.salaryFixed) {
                        setErrors((prev) => ({ ...prev, salaryFixed: "" }));
                      }
                    }}
                  />
                  {errors.salaryFixed && (
                    <FieldError>{errors.salaryFixed}</FieldError>
                  )}
                </Field>
              )}

              <Field>
                <FieldLabel>
                  Fecha de ingreso del candidato{" "}
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <DatePicker
                  value={entryDate}
                  onChange={(val) => {
                    setEntryDate(val);
                    if (errors.entryDate) {
                      setErrors((prev) => ({ ...prev, entryDate: "" }));
                    }
                  }}
                  placeholder="Seleccionar fecha"
                  minDate={isPrePlacement ? today : undefined}
                />
                {errors.entryDate && (
                  <FieldError>{errors.entryDate}</FieldError>
                )}
              </Field>

              {/* Info box for PRE_PLACEMENT */}
              {isPrePlacement && (
                <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  <HugeiconsIcon
                    icon={InformationCircleIcon}
                    className="mt-0.5 size-4 shrink-0"
                  />
                  <span>
                    Se enviará un recordatorio automático el día de ingreso del
                    candidato.
                  </span>
                </div>
              )}

              {/* Info box for PLACEMENT from PRE_PLACEMENT: values pre-loaded */}
              {isPlacementFromPrePlacement && (vacancySalaryFixed != null || vacancyEntryDate) && (
                <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  <HugeiconsIcon
                    icon={InformationCircleIcon}
                    className="mt-0.5 size-4 shrink-0"
                  />
                  <span>
                    Los valores de salario y fecha fueron cargados desde
                    Pre-Placement. Podés modificarlos antes de confirmar.
                  </span>
                </div>
              )}
            </>
          )}

          {/* ── Congrats email switch (PLACEMENT from any source) ── */}
          {showCongratsSwitch && (
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  ¿Enviar email de felicitaciones al candidato?
                </p>
                <p className="text-xs text-muted-foreground">
                  Se enviará un correo de bienvenida al candidato finalista.
                </p>
              </div>
              <Switch
                checked={sendCongratsEmail}
                onCheckedChange={setSendCongratsEmail}
              />
            </div>
          )}

          {/* ── ROLLBACK to HUNTING: reason + new target date ── */}
          {isRollbackToHunting && (
            <>
              <Field>
                <FieldLabel>
                  Motivo del retroceso <span className="text-destructive">*</span>
                </FieldLabel>
                <Textarea
                  placeholder="Describe el motivo del retroceso..."
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (errors.reason) {
                      setErrors((prev) => ({ ...prev, reason: "" }));
                    }
                  }}
                  rows={3}
                />
                {errors.reason && <FieldError>{errors.reason}</FieldError>}
              </Field>

              <Field>
                <FieldLabel>
                  Nueva fecha máxima de entrega{" "}
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <DatePicker
                  value={newTargetDeliveryDate}
                  onChange={(val) => {
                    setNewTargetDeliveryDate(val);
                    if (errors.newTargetDeliveryDate) {
                      setErrors((prev) => ({
                        ...prev,
                        newTargetDeliveryDate: "",
                      }));
                    }
                  }}
                  placeholder="Seleccionar fecha"
                  minDate={today}
                />
                {errors.newTargetDeliveryDate && (
                  <FieldError>{errors.newTargetDeliveryDate}</FieldError>
                )}
              </Field>
            </>
          )}

          {/* ── STAND_BY / CANCELADA / PERDIDA: reason required ── */}
          {isTerminal && (
            <Field>
              <FieldLabel>
                Motivo <span className="text-destructive">*</span>
              </FieldLabel>
              <Textarea
                placeholder="Describe el motivo del cambio de estado..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (errors.reason) {
                    setErrors((prev) => ({ ...prev, reason: "" }));
                  }
                }}
                rows={3}
              />
              {errors.reason && <FieldError>{errors.reason}</FieldError>}
            </Field>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!newStatus || transitionMutation.isPending}
          >
            {transitionMutation.isPending ? "Cambiando..." : "Confirmar cambio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
