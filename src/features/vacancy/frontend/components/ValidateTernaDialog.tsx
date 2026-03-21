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
import { Checkbox } from "@/core/shared/ui/shadcn/checkbox";
import { Badge } from "@shadcn/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserMultiple02Icon } from "@hugeicons/core-free-icons";
import { format } from "date-fns";
import { cn } from "@/core/lib/utils";
import { DatePicker } from "@shadcn/date-picker";
import { Label } from "@shadcn/label";
import { useValidateTerna } from "../hooks/useVacancyDetailMutations";
import type { VacancyCandidateDTO, CandidateStatus } from "../types/vacancy.types";
import { CANDIDATE_STATUS_LABELS } from "../types/vacancy.types";

interface ValidateTernaDialogProps {
  open: boolean;
  onClose: () => void;
  vacancyId: string;
  candidates: VacancyCandidateDTO[];
}

const candidateStatusColorMap: Record<CandidateStatus, string> = {
  EN_PROCESO: "bg-blue-100 text-blue-700 border-blue-200",
  EN_TERNA: "bg-violet-100 text-violet-700 border-violet-200",
  CONTRATADO: "bg-green-100 text-green-700 border-green-200",
  DESCARTADO: "bg-slate-100 text-slate-600 border-slate-200",
};

/** Candidatos que pueden ir en terna (no contratados ni descartados) */
const ELIGIBLE_STATUSES: CandidateStatus[] = [
  "EN_PROCESO",
  "EN_TERNA",
];

export function ValidateTernaDialog({
  open,
  onClose,
  vacancyId,
  candidates,
}: ValidateTernaDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [validatedAt, setValidatedAt] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const validateTernaMutation = useValidateTerna();

  const eligibleCandidates = candidates.filter((c) =>
    ELIGIBLE_STATUSES.includes(c.status),
  );

  const toggleCandidate = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0) return;
    const today = format(new Date(), "yyyy-MM-dd");
    await validateTernaMutation.mutateAsync({
      vacancyId,
      candidateIds: Array.from(selectedIds),
      // Only send validatedAt if user picked a date different from today
      validatedAt: validatedAt !== today ? validatedAt : undefined,
    });
    setSelectedIds(new Set());
    onClose();
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setValidatedAt(format(new Date(), "yyyy-MM-dd"));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Validar terna</DialogTitle>
          <DialogDescription>
            Seleccioná los candidatos que formarán parte de la terna. Serán
            marcados como <strong>Finalistas</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="validated-at-picker">Fecha de validación</Label>
          <DatePicker
            value={validatedAt}
            onChange={(date) => setValidatedAt(date)}
            maxDate={format(new Date(), "yyyy-MM-dd")}
            placeholder="Seleccionar fecha"
          />
        </div>

        <div className="space-y-2 py-2 max-h-72 overflow-y-auto pr-1">
          {eligibleCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
              <HugeiconsIcon
                icon={UserMultiple02Icon}
                size={28}
                strokeWidth={1.5}
              />
              <p className="text-sm">No hay candidatos elegibles para la terna</p>
            </div>
          ) : (
            eligibleCandidates.map((candidate) => {
              const isSelected = selectedIds.has(candidate.id);
              const fullName = `${candidate.firstName} ${candidate.lastName}`;

              return (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => toggleCandidate(candidate.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent/30",
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleCandidate(candidate.id)}
                    aria-label={`Seleccionar ${fullName}`}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">
                        {fullName}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          candidateStatusColorMap[candidate.status],
                          "text-xs font-medium shrink-0",
                        )}
                      >
                        {CANDIDATE_STATUS_LABELS[candidate.status]}
                      </Badge>
                    </div>
                    {candidate.salaryExpectation != null && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Expectativa: $
                        {candidate.salaryExpectation.toLocaleString("es-MX")}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {selectedIds.size > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {selectedIds.size} candidato(s) seleccionado(s)
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              selectedIds.size === 0 || validateTernaMutation.isPending
            }
          >
            {validateTernaMutation.isPending
              ? "Validando..."
              : `Validar terna (${selectedIds.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
