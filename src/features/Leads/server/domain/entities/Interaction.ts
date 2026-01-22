/**
 * Entidad de dominio Interaction
 * Representa una interacción/seguimiento con un contacto
 */

import type { Interaction as InteractionDTO, InteractionType } from "../../../frontend/types";

export interface InteractionProps {
  id: string;
  type: InteractionType;
  subject: string;
  content: string | null;
  date: Date;
  contactId: string;
  createdById: string;
  createdByName?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Interaction {
  private readonly props: InteractionProps;

  constructor(props: InteractionProps) {
    this.props = props;
  }

  // =============================================
  // GETTERS
  // =============================================

  get id(): string {
    return this.props.id;
  }

  get type(): InteractionType {
    return this.props.type;
  }

  get subject(): string {
    return this.props.subject;
  }

  get content(): string | null {
    return this.props.content;
  }

  get date(): Date {
    return this.props.date;
  }

  get contactId(): string {
    return this.props.contactId;
  }

  get createdById(): string {
    return this.props.createdById;
  }

  get createdByName(): string | undefined {
    return this.props.createdByName;
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

  // =============================================
  // MÉTODOS DE NEGOCIO
  // =============================================

  /**
   * Verifica si la interacción tiene contenido
   */
  hasContent(): boolean {
    return !!this.props.content;
  }

  /**
   * Convierte la entidad a DTO para transferencia
   */
  toJSON(): InteractionDTO {
    return {
      id: this.props.id,
      type: this.props.type,
      subject: this.props.subject,
      content: this.props.content,
      date: this.props.date.toISOString(),
      contactId: this.props.contactId,
      createdById: this.props.createdById,
      createdByName: this.props.createdByName,
      tenantId: this.props.tenantId,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
