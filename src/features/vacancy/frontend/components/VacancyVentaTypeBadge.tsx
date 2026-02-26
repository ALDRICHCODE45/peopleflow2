import { Badge } from "@shadcn/badge";
import { cn } from "@/core/lib/utils";
import type { VacancySaleType } from "../types/vacancy.types";
import { VACANCY_SALESTYPE_LABELS } from "../types/vacancy.types";

interface VacancySaleTypeBadgeProps {
  type: VacancySaleType;
  className?: string;
}

const typeColorMap: Record<VacancySaleType, string> = {
  NUEVA:
    "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  RECOMPRA: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
};

export function VacancySalesTypeBadge({
  type,
  className,
}: VacancySaleTypeBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(typeColorMap[type], "font-medium rounded-sm", className)}
    >
      {VACANCY_SALESTYPE_LABELS[type]}
    </Badge>
  );
}
