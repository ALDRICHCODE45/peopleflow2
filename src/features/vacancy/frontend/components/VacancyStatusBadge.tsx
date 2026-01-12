import { Badge } from "@shadcn/badge";
import type { VacancyStatus } from "../types/vacancy.types";
import { VACANCY_STATUS_LABELS } from "../types/vacancy.types";

interface VacancyStatusBadgeProps {
  status: VacancyStatus;
}

const statusVariants: Record<
  VacancyStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "secondary",
  OPEN: "default",
  CLOSED: "outline",
  ARCHIVED: "destructive",
};

export function VacancyStatusBadge({ status }: VacancyStatusBadgeProps) {
  return (
    <Badge variant={statusVariants[status]}>
      {VACANCY_STATUS_LABELS[status]}
    </Badge>
  );
}
