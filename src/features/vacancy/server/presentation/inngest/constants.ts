export const VACANCY_TERMINAL_STATUSES = [
  "CANCELADA",
  "PERDIDA",
  "STAND_BY",
  "PLACEMENT",
] as const;

export const VACANCY_STATUS_DISPLAY: Record<string, string> = {
  QUICK_MEETING: "Quick Meeting",
  HUNTING: "Hunting",
  FOLLOW_UP: "Follow Up",
  PRE_PLACEMENT: "Pre-Placement",
  PLACEMENT: "Placement",
  STAND_BY: "Stand By",
  CANCELADA: "Cancelada",
  PERDIDA: "Perdida",
};
