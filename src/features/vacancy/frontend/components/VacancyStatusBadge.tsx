import { Badge } from "@shadcn/badge";
import { cn } from "@/core/lib/utils";
import type { VacancyStatusType, VacancyModality } from "../types/vacancy.types";
import { VACANCY_STATUS_LABELS, VACANCY_MODALITY_LABELS } from "../types/vacancy.types";

// ── Status badge ─────────────────────────────────────────────────────────────

interface VacancyStatusBadgeProps {
  status: VacancyStatusType;
  className?: string;
}

const statusColorMap: Record<VacancyStatusType, string> = {
  QUICK_MEETING: "bg-sky-100 text-sky-700",
  HUNTING:       "bg-amber-100 text-amber-700",
  FOLLOW_UP:     "bg-violet-100 text-violet-700",
  PRE_PLACEMENT: "bg-yellow-100 text-yellow-700",
  PLACEMENT:     "bg-green-100 text-green-700",
  STAND_BY:      "bg-slate-100 text-slate-600",
  CANCELADA:     "bg-red-100 text-red-700",
  PERDIDA:       "bg-rose-100 text-rose-800",
};

export function VacancyStatusBadge({ status, className }: VacancyStatusBadgeProps) {
  return (
    <Badge
      className={cn(
        statusColorMap[status],
        "font-medium rounded-sm inline-flex items-center gap-1.5 px-2.5 whitespace-nowrap border-0",
        className,
      )}
    >
      <span className="h-[6px] w-[6px] rounded-full bg-current shrink-0" />
      {VACANCY_STATUS_LABELS[status]}
    </Badge>
  );
}

// ── Modalidad badge ───────────────────────────────────────────────────────────

const modalityColorMap: Record<VacancyModality, string> = {
  PRESENCIAL: "bg-blue-100 text-blue-700",
  REMOTO:     "bg-teal-100 text-teal-700",
  HIBRIDO:    "bg-indigo-100 text-indigo-700",
};

interface VacancyModalityBadgeProps {
  modality: VacancyModality;
  className?: string;
}

export function VacancyModalityBadge({ modality, className }: VacancyModalityBadgeProps) {
  return (
    <Badge
      className={cn(
        modalityColorMap[modality],
        "font-medium rounded-sm inline-flex items-center gap-1.5 px-2.5 whitespace-nowrap border-0",
        className,
      )}
    >
      <span className="h-[6px] w-[6px] rounded-full bg-current shrink-0" />
      {VACANCY_MODALITY_LABELS[modality]}
    </Badge>
  );
}
