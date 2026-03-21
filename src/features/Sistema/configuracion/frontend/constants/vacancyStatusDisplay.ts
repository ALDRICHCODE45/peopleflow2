import type { VacancyStatusType } from "@features/vacancy/frontend/types/vacancy.types";
import { VACANCY_STATUS_LABELS } from "@features/vacancy/frontend/types/vacancy.types";

/** Dot colors for vacancy statuses — mirrors the pipeline palette */
export const VACANCY_STATUS_DOT_COLORS: Record<VacancyStatusType, string> = {
  QUICK_MEETING: "bg-cyan-500",
  HUNTING: "bg-blue-500",
  FOLLOW_UP: "bg-yellow-500",
  PRE_PLACEMENT: "bg-orange-500",
  PLACEMENT: "bg-green-500",
  STAND_BY: "bg-gray-400",
  CANCELADA: "bg-red-500",
  PERDIDA: "bg-red-700",
};

/** Active (non-terminal) statuses for stale monitoring */
export const ACTIVE_VACANCY_STATUSES: VacancyStatusType[] = [
  "QUICK_MEETING",
  "HUNTING",
  "FOLLOW_UP",
  "PRE_PLACEMENT",
] as const;

export const ALL_VACANCY_STATUSES = Object.keys(
  VACANCY_STATUS_LABELS,
) as VacancyStatusType[];
