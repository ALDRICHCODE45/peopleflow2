/**
 * Interfaz del repositorio de Interactions
 * Define el contrato para la capa de infraestructura
 */

import { Interaction } from "../entities/Interaction";
import type { InteractionType } from "../../../frontend/types";

export interface CreateInteractionData {
  type: InteractionType;
  subject: string;
  content?: string | null;
  date?: Date;
  contactId: string;
  createdById: string;
  tenantId: string;
}

export interface UpdateInteractionData {
  type?: InteractionType;
  subject?: string;
  content?: string | null;
  date?: Date;
}

export interface IInteractionRepository {
  /**
   * Encuentra una interacción por su ID
   */
  findById(id: string, tenantId: string): Promise<Interaction | null>;

  /**
   * Obtiene todas las interacciones de un contacto
   */
  findByContactId(contactId: string, tenantId: string): Promise<Interaction[]>;

  /**
   * Obtiene todas las interacciones de un lead (a través de sus contactos)
   */
  findByLeadId(leadId: string, tenantId: string): Promise<Interaction[]>;

  /**
   * Crea una nueva interacción
   */
  create(data: CreateInteractionData): Promise<Interaction>;

  /**
   * Actualiza una interacción existente
   */
  update(
    id: string,
    tenantId: string,
    data: UpdateInteractionData
  ): Promise<Interaction | null>;

  /**
   * Elimina una interacción
   */
  delete(id: string, tenantId: string): Promise<boolean>;

  /**
   * Cuenta interacciones por contacto
   */
  countByContactId(contactId: string, tenantId: string): Promise<number>;
}
