/**
 * Entidad de dominio Contact
 * Representa un contacto (persona) dentro de un Lead
 */

import type {
  Contact as ContactDTO,
  LeadStatus,
} from "../../../frontend/types";

export interface ContactProps {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  linkedInUrl: string | null;
  isPrimary: boolean;
  tag: LeadStatus | null;
  notes: string | null;
  leadId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Contact {
  private readonly props: ContactProps;

  constructor(props: ContactProps) {
    this.props = props;
  }

  // =============================================
  // GETTERS
  // =============================================

  get id(): string {
    return this.props.id;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get email(): string | null {
    return this.props.email;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get position(): string | null {
    return this.props.position;
  }

  get linkedInUrl(): string | null {
    return this.props.linkedInUrl;
  }

  get isPrimary(): boolean {
    return this.props.isPrimary;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get leadId(): string {
    return this.props.leadId;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get tag(): LeadStatus | null {
    return this.props.tag;
  }

  // =============================================
  // MÉTODOS DE NEGOCIO
  // =============================================

  /**
   * Verifica si el contacto tiene información de comunicación
   */
  hasContactInfo(): boolean {
    return !!(this.props.email || this.props.phone || this.props.linkedInUrl);
  }

  /**
   * Convierte la entidad a DTO para transferencia
   */
  toJSON(): ContactDTO {
    return {
      id: this.props.id,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      email: this.props.email,
      phone: this.props.phone,
      tag: this.tag,
      position: this.props.position,
      linkedInUrl: this.props.linkedInUrl,
      isPrimary: this.props.isPrimary,
      notes: this.props.notes,
      leadId: this.props.leadId,
      tenantId: this.props.tenantId,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
