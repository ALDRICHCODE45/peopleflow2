"use client";

import { Badge } from "@shadcn/badge";
import { Button } from "@shadcn/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, Mail01Icon, SmartPhone01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/core/lib/utils";
import type { VacancyCandidateDTO, CandidateStatus } from "../types/vacancy.types";
import { CANDIDATE_STATUS_LABELS } from "../types/vacancy.types";

interface CandidateCardProps {
  candidate: VacancyCandidateDTO;
  onRemove: (candidateId: string) => void;
  isRemoving?: boolean;
}

const candidateStatusColorMap: Record<CandidateStatus, string> = {
  EN_PROCESO: "bg-blue-100 text-blue-700 border-blue-200",
  PRESENTADO: "bg-violet-100 text-violet-700 border-violet-200",
  FINALISTA: "bg-amber-100 text-amber-700 border-amber-200",
  CONTRATADO: "bg-green-100 text-green-700 border-green-200",
  DESCARTADO: "bg-slate-100 text-slate-600 border-slate-200",
};

export function CandidateCard({
  candidate,
  onRemove,
  isRemoving = false,
}: CandidateCardProps) {
  const fullName = `${candidate.firstName} ${candidate.lastName}`;

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3 bg-card hover:bg-accent/30 transition-colors">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm truncate">{fullName}</span>
          <Badge
            variant="outline"
            className={cn(
              candidateStatusColorMap[candidate.status],
              "text-xs font-medium shrink-0"
            )}
          >
            {CANDIDATE_STATUS_LABELS[candidate.status]}
          </Badge>
        </div>

        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          {candidate.email && (
            <div className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Mail01Icon} size={12} className="shrink-0" />
              <span className="truncate">{candidate.email}</span>
            </div>
          )}
          {candidate.phone && (
            <div className="flex items-center gap-1.5">
              <HugeiconsIcon
                icon={SmartPhone01Icon}
                size={12}
                className="shrink-0"
              />
              <span>{candidate.phone}</span>
            </div>
          )}
          {candidate.salaryExpectation != null && (
            <div className="flex items-center gap-1">
              <span className="text-foreground/60">Expectativa:</span>
              <span>${candidate.salaryExpectation.toLocaleString("es-MX")}</span>
            </div>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => onRemove(candidate.id)}
        disabled={isRemoving}
        aria-label={`Eliminar candidato ${fullName}`}
      >
        <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
      </Button>
    </div>
  );
}
