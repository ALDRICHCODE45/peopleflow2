import {
  type LeadStatus,
  LEAD_STATUS_LABELS,
} from "@features/Leads/frontend/types";

export const STATUS_DOT_COLORS: Record<LeadStatus, string> = {
  CONTACTO: "bg-cyan-500",
  CONTACTO_CALIDO: "bg-blue-500",
  SOCIAL_SELLING: "bg-purple-500",
  CITA_AGENDADA: "bg-yellow-500",
  CITA_ATENDIDA: "bg-orange-500",
  CITA_VALIDADA: "bg-green-500",
  POSICIONES_ASIGNADAS: "bg-emerald-500",
  STAND_BY: "bg-gray-400",
};

export const ALL_STATUSES = Object.keys(LEAD_STATUS_LABELS) as LeadStatus[];
