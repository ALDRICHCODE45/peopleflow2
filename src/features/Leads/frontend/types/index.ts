/**
 * Tipos compartidos para la feature de Leads
 */

// =============================================
// ENUMS Y CONSTANTES
// =============================================

export type LeadStatus =
  | "CONTACTO"
  | "CONTACTO_CALIDO"
  | "SOCIAL_SELLING"
  | "CITA_AGENDADA"
  | "CITA_ATENDIDA"
  | "CITA_VALIDADA"
  | "POSICIONES_ASIGNADAS"
  | "STAND_BY";

export type InteractionType =
  | "CALL"
  | "EMAIL"
  | "MEETING"
  | "NOTE"
  | "LINKEDIN"
  | "WHATSAPP";

export type AttachableType = "LEAD" | "CONTACT" | "INTERACTION" | "VACANCY";

// Mapeo de estados para UI
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  CONTACTO: "Contacto",
  CONTACTO_CALIDO: "Contacto Cálido",
  SOCIAL_SELLING: "Social Selling",
  CITA_AGENDADA: "Cita Agendada",
  CITA_ATENDIDA: "Cita Atendida",
  CITA_VALIDADA: "Cita Validada",
  POSICIONES_ASIGNADAS: "Posiciones Asignadas",
  STAND_BY: "Stand By",
};

export const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "CONTACTO", label: "Contacto" },
  { value: "CONTACTO_CALIDO", label: "Contacto Cálido" },
  { value: "SOCIAL_SELLING", label: "Social Selling" },
  { value: "CITA_AGENDADA", label: "Cita Agendada" },
  { value: "CITA_ATENDIDA", label: "Cita Atendida" },
  { value: "CITA_VALIDADA", label: "Cita Validada" },
  { value: "POSICIONES_ASIGNADAS", label: "Posiciones Asignadas" },
  { value: "STAND_BY", label: "Stand By" },
];

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  CALL: "Llamada",
  EMAIL: "Email",
  MEETING: "Reunión",
  NOTE: "Nota",
  LINKEDIN: "LinkedIn",
  WHATSAPP: "WhatsApp",
};

export const INTERACTION_TYPE_OPTIONS: {
  value: InteractionType;
  label: string;
}[] = [
  { value: "CALL", label: "Llamada" },
  { value: "EMAIL", label: "Email" },
  { value: "MEETING", label: "Reunión" },
  { value: "NOTE", label: "Nota" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "WHATSAPP", label: "WhatsApp" },
];

// =============================================
// INTERFACES DE ENTIDADES
// =============================================

export interface Sector {
  id: string;
  name: string;
  isActive: boolean;
  tenantId: string | null;
}

export interface Subsector {
  id: string;
  name: string;
  sectorId: string;
  isActive: boolean;
  tenantId: string | null;
}

export interface LeadOrigin {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  tenantId: string | null;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  linkedInUrl: string | null;
  isPrimary: boolean;
  notes: string | null;
  leadId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id: string;
  type: InteractionType;
  subject: string;
  content: string | null;
  date: string;
  contactId: string;
  createdById: string;
  createdByName?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadStatusHistoryItem {
  id: string;
  leadId: string;
  previousStatus: LeadStatus;
  newStatus: LeadStatus;
  changedById: string;
  changedByName?: string;
  tenantId: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  companyName: string;
  rfc: string | null;
  website: string | null;
  linkedInUrl: string | null;
  address: string | null;
  notes: string | null;
  status: LeadStatus;
  sectorId: string | null;
  sectorName?: string | null;
  subsectorId: string | null;
  subsectorName?: string | null;
  originId: string | null;
  originName?: string | null;
  assignedToId: string | null;
  assignedToName?: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  tenantId: string;
  createdById: string | null;
  createdByName?: string | null;
  createdAt: string;
  updatedAt: string;
  // Relaciones incluidas opcionalmente
  contacts?: Contact[];
  contactsCount?: number;
}

// =============================================
// TIPOS DE RESPUESTA PARA ACTIONS
// =============================================

export interface GetLeadsResult {
  error: string | null;
  leads: Lead[];
}

export interface CreateLeadResult {
  error: string | null;
  lead?: Lead;
}

export interface UpdateLeadResult {
  error: string | null;
  lead?: Lead;
}

export interface DeleteLeadResult {
  error: string | null;
  success: boolean;
}

export interface UpdateLeadStatusResult {
  error: string | null;
  lead?: Lead;
}

export interface ReasignLeadResult {
  error: string | null;
  lead?: Lead;
}

export interface GetContactsResult {
  error: string | null;
  contacts: Contact[];
}

export interface CreateContactResult {
  error: string | null;
  contact?: Contact;
}

export interface UpdateContactResult {
  error: string | null;
  contact?: Contact;
}

export interface DeleteContactResult {
  error: string | null;
  success: boolean;
}

export interface CreateInteractionResult {
  error: string | null;
  interaction?: Interaction;
}

export interface GetSectorsResult {
  error: string | null;
  sectors: Sector[];
}

export interface GetSubsectorsResult {
  error: string | null;
  subsectors: Subsector[];
}

export interface GetLeadOriginsResult {
  error: string | null;
  origins: LeadOrigin[];
}

// =============================================
// TIPOS PARA FORMULARIOS
// =============================================

export interface LeadFormData {
  companyName: string;
  rfc?: string;
  website?: string;
  linkedInUrl?: string;
  address?: string;
  notes?: string;
  status?: LeadStatus;
  sectorId?: string;
  subsectorId?: string;
  originId?: string;
  assignedToId: string;
}

export interface CreateLeadFormData {
  companyName: string;
  rfc?: string;
  website?: string;
  linkedInUrl?: string;
  address?: string;
  notes?: string;
  sectorId?: string;
  subsectorId?: string;
  originId?: string;
}

export interface EditLeadFormData extends CreateLeadFormData {
  status: LeadStatus;
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  position?: string;
  linkedInUrl?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface InteractionFormData {
  type: InteractionType;
  subject: string;
  content?: string;
  date?: string;
  contactId: string;
}
