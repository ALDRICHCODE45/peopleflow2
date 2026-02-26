import type { VacancyStatusType } from "../../../types/vacancy.types";
import { VACANCY_STATUS_LABELS } from "../../../types/vacancy.types";

export const vacancyStatusOptions: { value: VacancyStatusType | "todos"; label: string }[] = [
  { value: "todos", label: "Todos los Estados" },
  ...Object.entries(VACANCY_STATUS_LABELS).map(([value, label]) => ({
    value: value as VacancyStatusType,
    label,
  })),
];
