/**
 * Interfaz del repositorio de LeadStatusHistory
 * Define el contrato para la capa de infraestructura
 */

import type { LeadStatusType } from "../value-objects/LeadStatus";

export interface LeadStatusHistoryItem {
  id: string;
  leadId: string;
  previousStatus: LeadStatusType;
  newStatus: LeadStatusType;
  changedById: string;
  changedByName?: string;
  tenantId: string;
  createdAt: Date;
}

export interface CreateLeadStatusHistoryData {
  leadId: string;
  previousStatus: LeadStatusType;
  newStatus: LeadStatusType;
  changedById: string;
  tenantId: string;
}

export interface ILeadStatusHistoryRepository {
  /**
   * Crea un registro de historial de cambio de estado
   */
  create(data: CreateLeadStatusHistoryData): Promise<LeadStatusHistoryItem>;

  /**
   * Obtiene el historial de estados de un lead
   */
  findByLeadId(leadId: string, tenantId: string): Promise<LeadStatusHistoryItem[]>;

  /**
   * Cuenta cambios de estado por lead
   */
  countByLeadId(leadId: string, tenantId: string): Promise<number>;
}
