"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@shadcn/dialog";
import { Button } from "@shadcn/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { useUpdateCandidate } from "../hooks/useVacancyDetailMutations";
import type { VacancyCandidateDTO } from "../types/vacancy.types";

interface SelectFinalistDialogProps {
  open: boolean;
  onClose: () => void;
  candidate: VacancyCandidateDTO;
  vacancyId: string;
}

export function SelectFinalistDialog({
  open,
  onClose,
  candidate,
  vacancyId,
}: SelectFinalistDialogProps) {
  const updateCandidateMutation = useUpdateCandidate();
  const fullName = `${candidate.firstName} ${candidate.lastName}`;

  const handleConfirm = async () => {
    await updateCandidateMutation.mutateAsync({
      candidateId: candidate.id,
      vacancyId,
      data: { status: "CONTRATADO" },
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                size={20}
                className="text-green-600 dark:text-green-400"
              />
            </div>
            <DialogTitle>Confirmar como contratado</DialogTitle>
          </div>
          <DialogDescription className="pt-1">
            Al confirmar, <b>{fullName}</b> quedará marcado como{" "}
            <b>Contratado</b> y el resto de los candidatos pasarán
            automáticamente a <b>Descartado</b>.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={updateCandidateMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleConfirm}
            disabled={updateCandidateMutation.isPending}
          >
            {updateCandidateMutation.isPending
              ? "Procesando..."
              : "Confirmar contratado"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
