"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shadcn/dialog";
import { Button } from "@shadcn/button";
import { Textarea } from "@shadcn/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/select";
import { Field, FieldLabel } from "@/core/shared/ui/shadcn/field";
import { DatePicker } from "@/core/shared/ui/shadcn/date-picker";
import { VacancyStatusBadge } from "./VacancyStatusBadge";
import { useTransitionVacancyStatus } from "../hooks/useVacancyDetailMutations";
import type { VacancyStatusType } from "../types/vacancy.types";
import { VACANCY_STATUS_LABELS } from "../types/vacancy.types";

interface VacancyStatusTransitionDialogProps {
  open: boolean;
  onClose: () => void;
  vacancyId: string;
  currentStatus: VacancyStatusType;
}

const ALL_STATUSES: VacancyStatusType[] = [
  "QUICK_MEETING",
  "HUNTING",
  "FOLLOW_UP",
  "PRE_PLACEMENT",
  "PLACEMENT",
  "STAND_BY",
  "CANCELADA",
  "PERDIDA",
];

export function VacancyStatusTransitionDialog({
  open,
  onClose,
  vacancyId,
  currentStatus,
}: VacancyStatusTransitionDialogProps) {
  const [newStatus, setNewStatus] = useState<VacancyStatusType | "">("");
  const [reason, setReason] = useState("");
  const [newTargetDeliveryDate, setNewTargetDeliveryDate] = useState("");

  const transitionMutation = useTransitionVacancyStatus();

  const availableStatuses = ALL_STATUSES.filter((s) => s !== currentStatus);

  const handleSubmit = async () => {
    if (!newStatus) return;

    await transitionMutation.mutateAsync({
      vacancyId,
      newStatus,
      reason: reason.trim() || undefined,
      newTargetDeliveryDate: newTargetDeliveryDate || undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setNewStatus("");
    setReason("");
    setNewTargetDeliveryDate("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar estado de la vacante</DialogTitle>
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
            <Select
              value={newStatus}
              onValueChange={(v) => setNewStatus(v as VacancyStatusType)}
            >
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

          {/* Motivo */}
          <Field>
            <FieldLabel>Motivo (opcional)</FieldLabel>
            <Textarea
              placeholder="Describe el motivo del cambio..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </Field>

          {/* Nueva fecha de entrega */}
          <Field>
            <FieldLabel>Nueva fecha de entrega (opcional)</FieldLabel>
            <DatePicker
              value={newTargetDeliveryDate}
              onChange={setNewTargetDeliveryDate}
              placeholder="Seleccionar fecha"
            />
          </Field>
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
