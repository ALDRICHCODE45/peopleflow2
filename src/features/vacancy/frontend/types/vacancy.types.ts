// DTO de Adjunto (Attachment)
export interface AttachmentDTO {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  subType: "JOB_DESCRIPTION" | "PERFIL_MUESTRA" | "CV" | "OTHER";
  isValidated: boolean;
  validatedAt: string | null;
  validatedById: string | null;
  rejectionReason: string | null;
  vacancyId: string | null;
  vacancyCandidateId: string | null;
  uploadedById: string;
  createdAt: string;
}

// Tipos de dominio (mirrors de los enums de Prisma)
export type VacancyStatusType =
  | "QUICK_MEETING"
  | "HUNTING"
  | "FOLLOW_UP"
  | "PRE_PLACEMENT"
  | "PLACEMENT"
  | "STAND_BY"
  | "CANCELADA"
  | "PERDIDA";

export type VacancySaleType = "NUEVA" | "RECOMPRA";
export type VacancyModality = "PRESENCIAL" | "REMOTO" | "HIBRIDO";
export type CandidateStatus =
  | "EN_PROCESO"
  | "EN_TERNA"
  | "CONTRATADO"
  | "DESCARTADO";

export type CandidateMatchRating = "CUMPLE" | "NO_CUMPLE" | "PARCIAL";

// DTO principal de Vacancy
export interface VacancyDTO {
  id: string;
  position: string;
  status: VacancyStatusType;
  recruiterId: string;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  recruiterAvatar?: string | null;
  clientId: string;
  clientName?: string | null;
  saleType: VacancySaleType;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryFixed: number | null;
  commissions: string | null;
  benefits: string | null;
  tools: string | null;
  modality: VacancyModality | null;
  schedule: string | null;
  countryCode: string | null;
  regionCode: string | null;
  requiresPsychometry: boolean;
  checklistValidatedAt: string | null;
  checklistValidatedById: string | null;
  checklistRejectionReason: string | null;
  assignedAt: string;
  targetDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  entryDate: string | null;
  rollbackCount: number;
  placementConfirmedAt: string | null;
  commissionDate: string | null;
  congratsEmailSent: boolean;
  tenantId: string;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  // Relaciones opcionales
  candidates?: VacancyCandidateDTO[];
  checklistItems?: VacancyChecklistItemDTO[];
  statusHistory?: VacancyStatusHistoryDTO[];
  attachments?: AttachmentDTO[];
}

/**
 * Aliases de compatibilidad para componentes existentes (Phase 6 los reemplazará).
 * Nombres canónicos: VacancyDTO, VacancyStatusType.
 */
export type Vacancy = VacancyDTO;
export type VacancyStatus = VacancyStatusType;

// DTO de candidato
export interface VacancyCandidateDTO {
  id: string;
  vacancyId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  isCurrentlyEmployed: boolean | null;
  currentCompany: string | null;
  currentSalary: number | null;
  salaryExpectation: number | null;
  currentModality: VacancyModality | null;
  countryCode: string | null;
  regionCode: string | null;
  currentCommissions: string | null;
  currentBenefits: string | null;

  otherBenefits: string | null;
  status: CandidateStatus;
  isInTerna: boolean;
  isFinalist: boolean;
  finalSalary: number | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  checklistMatches?: VacancyCandidateMatchDTO[];
  attachments?: AttachmentDTO[];
}

// DTO de ítem de checklist
export interface VacancyChecklistItemDTO {
  id: string;
  vacancyId: string;
  requirement: string;
  isCompleted: boolean;
  order: number;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// DTO de match cualitativo
export interface VacancyCandidateMatchDTO {
  id: string;
  candidateId: string;
  checklistItemId: string;
  rating: CandidateMatchRating | null;
  feedback: string | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// DTO de historial de estado
export interface VacancyStatusHistoryDTO {
  id: string;
  vacancyId: string;
  previousStatus: VacancyStatusType;
  newStatus: VacancyStatusType;
  isRollback: boolean;
  reason: string | null;
  newTargetDeliveryDate: string | null;
  changedById: string;
  changedByName?: string | null;
  tenantId: string;
  createdAt: string;
}

// DTO de config
export interface VacancyConfigDTO {
  id: string;
  tenantId: string;
  quickMeetingSlaHours: number;
  requirePhone: boolean;
  requireEmail: boolean;
  requireIsCurrentlyEmployed: boolean;
  requireCurrentCompany: boolean;
  requireCurrentSalary: boolean;
  requireSalaryExpectation: boolean;
  requireCurrentModality: boolean;
  requireCurrentLocation: boolean;
  requireCurrentCommissions: boolean;
  requireCurrentBenefits: boolean;
  requireCandidateLocation: boolean;
  requireOtherBenefits: boolean;
  requireCv: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tipos de respuesta para server actions
export interface GetVacanciesResult {
  error: string | null;
  vacancies: VacancyDTO[];
}
export interface GetVacancyDetailResult {
  error: string | null;
  vacancy?: VacancyDTO;
}
export interface CreateVacancyResult {
  error: string | null;
  vacancy?: VacancyDTO;
}
export interface UpdateVacancyResult {
  error: string | null;
  vacancy?: VacancyDTO;
}
export interface DeleteVacancyResult {
  error: string | null;
  success: boolean;
}
export interface TransitionVacancyStatusResult {
  error: string | null;
  vacancy?: VacancyDTO;
}
export interface ValidateTernaResult {
  error: string | null;
  vacancy?: VacancyDTO;
}
export interface ConfirmPlacementResult {
  error: string | null;
  vacancy?: VacancyDTO;
}
export interface AddCandidateResult {
  error: string | null;
  candidate?: VacancyCandidateDTO;
}
export interface UpdateCandidateResult {
  error: string | null;
  candidate?: VacancyCandidateDTO;
}
export interface DeleteCandidateResult {
  error: string | null;
  success: boolean;
}
export interface SelectFinalistResult {
  error: string | null;
  vacancy?: VacancyDTO;
}
export interface ChecklistItemResult {
  error: string | null;
  item?: VacancyChecklistItemDTO;
}
export interface DeleteChecklistItemResult {
  error: string | null;
  success: boolean;
}
export interface SaveMatchResult {
  error: string | null;
  match?: VacancyCandidateMatchDTO;
}
export interface GetVacancyConfigResult {
  error: string | null;
  config?: VacancyConfigDTO;
}
export interface UpsertVacancyConfigResult {
  error: string | null;
  config?: VacancyConfigDTO;
}

// Tipos de resultado para acciones de Attachments
export interface GetVacancyAttachmentsResult {
  error: string | null;
  attachments?: AttachmentDTO[];
}
export interface DeleteVacancyAttachmentResult {
  error: string | null;
  success: boolean;
}
export interface ValidateAttachmentResult {
  error: string | null;
  attachment?: AttachmentDTO;
}
export interface RejectAttachmentResult {
  error: string | null;
  attachment?: AttachmentDTO;
}
export interface ValidateChecklistResult {
  error: string | null;
  vacancy?: Pick<
    VacancyDTO,
    | "id"
    | "checklistValidatedAt"
    | "checklistValidatedById"
    | "checklistRejectionReason"
  >;
}
export interface RejectChecklistResult {
  error: string | null;
  vacancy?: Pick<
    VacancyDTO,
    | "id"
    | "checklistValidatedAt"
    | "checklistValidatedById"
    | "checklistRejectionReason"
  >;
}

// Labels y opciones para UI

export const VACANCY_SALESTYPE_LABELS: Record<VacancySaleType, string> = {
  NUEVA: "Nueva",
  RECOMPRA: "Recompra",
};

export const VACANCY_STATUS_LABELS: Record<VacancyStatusType, string> = {
  QUICK_MEETING: "Quick Meeting",
  HUNTING: "Hunting",
  FOLLOW_UP: "Follow Up",
  PRE_PLACEMENT: "Pre-Placement",
  PLACEMENT: "Placement",
  STAND_BY: "Stand By",
  CANCELADA: "Cancelada",
  PERDIDA: "Perdida",
};

export const VACANCY_STATUS_OPTIONS: {
  value: VacancyStatusType;
  label: string;
}[] = Object.entries(VACANCY_STATUS_LABELS).map(([value, label]) => ({
  value: value as VacancyStatusType,
  label,
}));

export const VACANCY_MODALITY_LABELS: Record<VacancyModality, string> = {
  PRESENCIAL: "Presencial",
  REMOTO: "Remoto",
  HIBRIDO: "Híbrido",
};

export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  EN_PROCESO: "En Proceso",
  EN_TERNA: "En Terna",
  CONTRATADO: "Contratado",
  DESCARTADO: "Descartado",
};

// Tipos para formularios
export interface CreateVacancyFormData {
  position: string;
  recruiterId: string;
  clientId: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  commissions?: string;
  benefits?: string;
  tools?: string;
  modality?: VacancyModality;
  schedule?: string;
  countryCode?: string;
  regionCode?: string;
  requiresPsychometry: boolean;
  targetDeliveryDate?: string;
  sendNotification?: boolean;
}

export interface UpdateVacancyFormData extends Partial<CreateVacancyFormData> {
  salaryFixed?: number | null;
  entryDate?: string | null;
}

/** Transiciones válidas por estado — mirror del backend state machine */
export const VALID_TRANSITIONS: Partial<Record<VacancyStatusType, VacancyStatusType[]>> = {
  QUICK_MEETING: ["HUNTING", "STAND_BY", "CANCELADA", "PERDIDA"],
  HUNTING: ["FOLLOW_UP", "STAND_BY", "CANCELADA", "PERDIDA"],
  FOLLOW_UP: ["HUNTING", "PRE_PLACEMENT", "PLACEMENT", "STAND_BY", "CANCELADA", "PERDIDA"],
  PRE_PLACEMENT: ["PLACEMENT", "HUNTING", "STAND_BY", "CANCELADA", "PERDIDA"],
  PLACEMENT: ["HUNTING", "STAND_BY", "CANCELADA", "PERDIDA"],
  STAND_BY: ["QUICK_MEETING", "HUNTING", "FOLLOW_UP", "PRE_PLACEMENT", "CANCELADA", "PERDIDA"],
  CANCELADA: [],
  PERDIDA: [],
};

// DTO del historial de ternas
export interface TernaHistoryCandidateDTO {
  id: string;
  candidateId: string;
  candidateFullName: string;
}

export interface TernaHistoryDTO {
  id: string;
  vacancyId: string;
  ternaNumber: number;
  validatedAt: string;
  validatedById: string;
  validatedByName: string | null;
  targetDeliveryDate: string | null;
  isOnTime: boolean;
  tenantId: string;
  candidates: TernaHistoryCandidateDTO[];
}

export interface GetTernaHistoryResult {
  error: string | null;
  histories?: TernaHistoryDTO[];
}

export interface AddCandidateFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  isCurrentlyEmployed?: boolean;
  currentCompany?: string;
  currentSalary?: number;
  salaryExpectation?: number;
  currentModality?: VacancyModality;
  countryCode?: string;
  regionCode?: string;
  currentCommissions?: string;
  currentBenefits?: string;
  otherBenefits?: string;
}
