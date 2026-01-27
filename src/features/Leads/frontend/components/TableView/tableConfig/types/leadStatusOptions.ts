import type { LeadStatus } from "../../../../types";

export const leadStatusOptions: {
  value: LeadStatus | "todos";
  label: string;
}[] = [
  { value: "todos", label: "Todos los estados" },
  { value: "CONTACTO", label: "Contacto" },
  { value: "CONTACTO_CALIDO", label: "Contacto Cálido" },
  { value: "SOCIAL_SELLING", label: "Social Selling" },
  { value: "CITA_AGENDADA", label: "Cita Agendada" },
  { value: "CITA_ATENDIDA", label: "Cita Atendida" },
  { value: "CITA_VALIDADA", label: "Cita Validada" },
  { value: "POSICIONES_ASIGNADAS", label: "Posiciones Asignadas" },
  { value: "STAND_BY", label: "Stand By" },
];
