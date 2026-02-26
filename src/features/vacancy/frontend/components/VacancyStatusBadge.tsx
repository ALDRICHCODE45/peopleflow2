import { Badge } from "@shadcn/badge";
import { cn } from "@/core/lib/utils";
import type { VacancyStatusType } from "../types/vacancy.types";
import { VACANCY_STATUS_LABELS } from "../types/vacancy.types";

interface VacancyStatusBadgeProps {
  status: VacancyStatusType;
  className?: string;
}

const statusColorMap: Record<VacancyStatusType, string> = {
  QUICK_MEETING: "bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100",
  HUNTING: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  FOLLOW_UP:
    "bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100",
  PRE_PLACEMENT:
    "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
  PLACEMENT: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
  STAND_BY: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100",
  CANCELADA: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
  PERDIDA: "bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100",
};

export function VacancyStatusBadge({
  status,
  className,
}: VacancyStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        statusColorMap[status],
        "font-medium rounded-sm",
        className,
      )}
    >
      {VACANCY_STATUS_LABELS[status]}
    </Badge>
  );
}
