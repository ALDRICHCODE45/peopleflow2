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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/shared/ui/shadcn/select";
import { Textarea } from "@/core/shared/ui/shadcn/textarea";
import { Field, FieldLabel, FieldError } from "@/core/shared/ui/shadcn/field";
import { LoadingButton } from "@/core/shared/ui/shadcn/loading-button";
import { SearchableSelect } from "@/core/shared/components/SearchableSelect";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";
import { useReassignVacancy } from "../hooks/useReassignVacancy";
import {
  REASSIGNMENT_REASON_LABELS,
  type ReassignmentReasonType,
} from "../types/vacancy.types";

interface ReassignVacancyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacancyId: string;
  vacancyPosition: string;
  currentRecruiterId: string;
}

export function ReassignVacancyDialog({
  open,
  onOpenChange,
  vacancyId,
  vacancyPosition,
  currentRecruiterId,
}: ReassignVacancyDialogProps) {
  const { data: users, isPending: isLoadingUsers } = useTenantUsersQuery();
  const reassignMutation = useReassignVacancy();

  const [selectedRecruiterId, setSelectedRecruiterId] = useState<
    string | undefined
  >(undefined);
  const [reason, setReason] = useState<ReassignmentReasonType | undefined>(
    undefined,
  );
  const [notes, setNotes] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const recruiterOptions = useMemo(
    () =>
      (users ?? [])
        .filter((u) => u.id !== currentRecruiterId)
        .map((u) => ({
          value: u.id,
          label: u.name ?? u.email,
          avatar: u.avatar,
        })),
    [users, currentRecruiterId],
  );

  const canSubmit = !!selectedRecruiterId && !!reason;

  const handleSubmit = async () => {
    setShowErrors(true);
    if (!canSubmit) return;

    try {
      await reassignMutation.mutateAsync({
        vacancyId,
        newRecruiterId: selectedRecruiterId,
        reason,
        notes: notes.trim() || undefined,
      });
      handleClose();
    } catch {
      // Error handled by mutation hook
    }
  };

  const handleClose = () => {
    setSelectedRecruiterId(undefined);
    setReason(undefined);
    setNotes("");
    setShowErrors(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reasignar vacante</DialogTitle>
          <DialogDescription>
            Selecciona el nuevo reclutador para &ldquo;{vacancyPosition}&rdquo;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Recruiter selector */}
          <Field>
            <FieldLabel>Nuevo reclutador</FieldLabel>
            <SearchableSelect
              options={recruiterOptions}
              value={selectedRecruiterId}
              onChange={(value) => setSelectedRecruiterId(value)}
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

          {/* Reason selector */}
          <Field>
            <FieldLabel>Motivo de reasignación</FieldLabel>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as ReassignmentReasonType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REASSIGNMENT_REASON_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            {showErrors && !reason && (
              <FieldError>Debes seleccionar un motivo</FieldError>
            )}
          </Field>

          {/* Notes */}
          <Field>
            <FieldLabel>Notas</FieldLabel>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo adicional (opcional)"
              className="min-h-20 resize-none"
            />
          </Field>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={reassignMutation.isPending}>
              Cancelar
            </Button>
          </DialogClose>

          <LoadingButton
            variant="default"
            isLoading={reassignMutation.isPending}
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
