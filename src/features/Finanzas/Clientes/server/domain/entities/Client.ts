/**
 * Entidad de dominio Client
 * Representa un cliente convertido desde un Lead
 */

export interface ClientProps {
  id: string;
  nombre: string;
  leadId: string;
  generadorId: string | null;
  generadorName?: string | null;
  origenId: string | null;
  origenName?: string | null;
  tenantId: string;
  createdById: string | null;
  createdByName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Client {
  private readonly props: ClientProps;

  constructor(props: ClientProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  get leadId(): string {
    return this.props.leadId;
  }

  get generadorId(): string | null {
    return this.props.generadorId;
  }

  get generadorName(): string | null | undefined {
    return this.props.generadorName;
  }

  get origenId(): string | null {
    return this.props.origenId;
  }

  get origenName(): string | null | undefined {
    return this.props.origenName;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get createdById(): string | null {
    return this.props.createdById;
  }

  get createdByName(): string | null | undefined {
    return this.props.createdByName;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON() {
    return {
      id: this.props.id,
      nombre: this.props.nombre,
      leadId: this.props.leadId,
      generadorId: this.props.generadorId,
      generadorName: this.props.generadorName,
      origenId: this.props.origenId,
      origenName: this.props.origenName,
      tenantId: this.props.tenantId,
      createdById: this.props.createdById,
      createdByName: this.props.createdByName,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
