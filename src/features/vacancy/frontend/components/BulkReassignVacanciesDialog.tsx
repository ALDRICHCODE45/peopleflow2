"use client";

import { useMemo, useState } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/shared/ui/shadcn/avatar";
import { Button } from "@/core/shared/ui/shadcn/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/shared/ui/shadcn/dialog";
import { Field, FieldError, FieldLabel } from "@/core/shared/ui/shadcn/field";
import { LoadingButton } from "@/core/shared/ui/shadcn/loading-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/shared/ui/shadcn/select";
import { Textarea } from "@/core/shared/ui/shadcn/textarea";
import { SearchableSelect } from "@/core/shared/components/SearchableSelect";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";

import { useBulkReassignVacancies } from "../hooks/useBulkReassignVacancies";
import {
  REASSIGNMENT_REASON_LABELS,
  type ReassignmentReasonType,
  type VacancyDTO,
  type VacancyStatusType,
} from "../types/vacancy.types";

const REASSIGNABLE_STATUSES: VacancyStatusType[] = [
  "QUICK_MEETING",
  "HUNTING",
  "FOLLOW_UP",
  "PRE_PLACEMENT",
  "STAND_BY",
];

interface BulkReassignVacanciesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds?: string[];
  selectedVacancies?: VacancyDTO[];
  onCompleted?: () => void;
}

export function BulkReassignVacanciesDialog({
  open,
  onOpenChange,
  selectedIds,
  selectedVacancies,
  onCompleted,
}: BulkReassignVacanciesDialogProps) {
  const { data: users, isPending: isLoadingUsers } = useTenantUsersQuery();
  const mutation = useBulkReassignVacancies();

  const [selectedRecruiterId, setSelectedRecruiterId] = useState<string | undefined>(undefined);
  const [reason, setReason] = useState<ReassignmentReasonType | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const vacancyIds = useMemo(
    () => selectedIds ?? (selectedVacancies ?? []).map((vacancy) => vacancy.id),
    [selectedIds, selectedVacancies],
  );

  const hasNonReassignable = useMemo(
    () =>
      (selectedVacancies ?? []).some(
        (vacancy) => !REASSIGNABLE_STATUSES.includes(vacancy.status),
      ),
    [selectedVacancies],
  );

  const recruiterOptions = useMemo(
    () =>
      (users ?? []).map((user) => ({
        value: user.id,
        label: user.name ?? user.email,
        avatar: user.avatar,
      })),
    [users],
  );

  const canSubmit = Boolean(selectedRecruiterId && reason && vacancyIds.length > 0);

  const handleClose = () => {
    setSelectedRecruiterId(undefined);
    setReason(undefined);
    setNotes("");
    setShowErrors(false);
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    setShowErrors(true);
    if (!canSubmit || !selectedRecruiterId || !reason) {
      return;
    }

    try {
      await mutation.mutateAsync({
        ids: vacancyIds,
        vacancyIds,
        recruiterId: selectedRecruiterId,
        reason,
        notes: notes.trim() || undefined,
      });
      handleClose();
      onCompleted?.();
    } catch {
      // Toast handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Reasignar {vacancyIds.length} vacante{vacancyIds.length === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>
            Seleccioná el nuevo reclutador y el motivo para las vacantes seleccionadas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {hasNonReassignable && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Algunas vacantes seleccionadas no están en un estado reasignable y se reportarán
              como fallidas.
            </div>
          )}

          <Field>
            <FieldLabel>Nuevo reclutador</FieldLabel>
            <SearchableSelect
              options={recruiterOptions}
              value={selectedRecruiterId}
              onChange={setSelectedRecruiterId}
              placeholder="Selecciona un reclutador"
              searchPlaceholder="Buscar reclutador..."
              disabled={isLoadingUsers}
              renderOption={(opt) => (
                <>
                  <Avatar className="size-6">
                    <AvatarImage src={opt.avatar ?? ""} alt="reclutador" />
                    <AvatarFallback className="text-xs">
                      {opt.label.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{opt.label}</span>
                </>
              )}
              renderSelected={(opt) => (
                <span className="flex items-center gap-2 truncate">
                  <Avatar className="size-6">
                    <AvatarImage src={opt.avatar ?? ""} alt="reclutador" />
                    <AvatarFallback className="text-xs">
                      {opt.label.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {opt.label}
                </span>
              )}
            />
            {showErrors && !selectedRecruiterId && (
              <FieldError>Debes seleccionar un reclutador</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel>Motivo de reasignación</FieldLabel>
            <Select
              value={reason}
              onValueChange={(value) => setReason(value as ReassignmentReasonType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REASSIGNMENT_REASON_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showErrors && !reason && <FieldError>Debes seleccionar un motivo</FieldError>}
          </Field>

          <Field>
            <FieldLabel>Notas</FieldLabel>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Notas adicionales (opcional)"
              className="min-h-20 resize-none"
            />
          </Field>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={mutation.isPending}>
              Cancelar
            </Button>
          </DialogClose>

          <LoadingButton
            variant="default"
            isLoading={mutation.isPending}
            loadingText="Reasignando..."
            onClick={handleSubmit}
            disabled={!canSubmit || isLoadingUsers}
          >
            Reasignar
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
