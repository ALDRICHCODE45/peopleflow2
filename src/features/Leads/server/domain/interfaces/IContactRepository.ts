/**
 * Interfaz del repositorio de Contacts
 * Define el contrato para la capa de infraestructura
 */

import { Contact } from "../entities/Contact";

export interface CreateContactData {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  linkedInUrl?: string | null;
  isPrimary?: boolean;
  notes?: string | null;
  leadId: string;
  tenantId: string;
}

export interface UpdateContactData {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  linkedInUrl?: string | null;
  isPrimary?: boolean;
  notes?: string | null;
}

export interface IContactRepository {
  /**
   * Encuentra un contacto por su ID
   */
  findById(id: string, tenantId: string): Promise<Contact | null>;

  /**
   * Obtiene todos los contactos de un lead
   */
  findByLeadId(leadId: string, tenantId: string): Promise<Contact[]>;

  /**
   * Crea un nuevo contacto
   */
  create(data: CreateContactData): Promise<Contact>;

  /**
   * Actualiza un contacto existente
   */
  update(
    id: string,
    tenantId: string,
    data: UpdateContactData
  ): Promise<Contact | null>;

  /**
   * Elimina un contacto
   */
  delete(id: string, tenantId: string): Promise<boolean>;

  /**
   * Establece un contacto como primario (y quita el primario de los demás)
   */
  setPrimary(
    contactId: string,
    leadId: string,
    tenantId: string
  ): Promise<boolean>;

  /**
   * Cuenta contactos por lead
   */
  countByLeadId(leadId: string, tenantId: string): Promise<number>;
}
