/**
 * Tipos compartidos para la feature de Vacantes
 */

export type VacancyStatus = "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";

export interface Vacancy {
  id: string;
  title: string;
  description: string;
  status: VacancyStatus;
  department: string | null;
  location: string | null;
  tenantId: string;
  // Dates are serialized to ISO strings when crossing server/client boundary
  createdAt: string;
  updatedAt: string;
}

// Tipos de respuesta para las actions
export interface GetVacanciesResult {
  error: string | null;
  vacancies: Vacancy[];
}

export interface CreateVacancyResult {
  error: string | null;
  vacancy?: Vacancy;
}

export interface UpdateVacancyResult {
  error: string | null;
  vacancy?: Vacancy;
}

export interface DeleteVacancyResult {
  error: string | null;
  success: boolean;
}

// Tipos para formularios
export interface VacancyFormData {
  title: string;
  description: string;
  status: VacancyStatus;
  department: string;
  location: string;
}

// Mapeo de estados para UI
export const VACANCY_STATUS_LABELS: Record<VacancyStatus, string> = {
  DRAFT: "Borrador",
  OPEN: "Abierta",
  CLOSED: "Cerrada",
  ARCHIVED: "Archivada",
};

export const VACANCY_STATUS_OPTIONS: { value: VacancyStatus; label: string }[] =
  [
    { value: "DRAFT", label: "Borrador" },
    { value: "OPEN", label: "Abierta" },
    { value: "CLOSED", label: "Cerrada" },
    { value: "ARCHIVED", label: "Archivada" },
  ];
