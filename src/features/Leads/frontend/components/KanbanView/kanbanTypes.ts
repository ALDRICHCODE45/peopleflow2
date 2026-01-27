import type { LeadStatus } from "../../types";

export interface KanbanColumn {
  id: LeadStatus;
  title: string;
}

export const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  { id: "CONTACTO", title: "Contacto" },
  { id: "SOCIAL_SELLING", title: "Social Selling" },
  { id: "CONTACTO_CALIDO", title: "Contacto Calido" },
  { id: "CITA_AGENDADA", title: "Cita Agendada" },
  { id: "CITA_ATENDIDA", title: "Cita Atendida" },
  { id: "CITA_VALIDADA", title: "Cita Validada" },
  { id: "POSICIONES_ASIGNADAS", title: "Asignadas" },
  { id: "STAND_BY", title: "Stand By" },
];
