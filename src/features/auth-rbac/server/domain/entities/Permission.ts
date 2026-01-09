/**
 * Entidad de dominio Permission
 * Representa un permiso en el sistema RBAC
 */

export interface PermissionProps {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Permission {
  private readonly props: PermissionProps;

  constructor(props: PermissionProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get resource(): string {
    return this.props.resource;
  }

  get action(): string {
    return this.props.action;
  }

  get description(): string | null {
    return this.props.description;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Verifica si este permiso otorga acceso total
   */
  isWildcard(): boolean {
    return this.props.name === "*";
  }

  /**
   * Verifica si el permiso coincide con un recurso y acción
   */
  matches(resource: string, action: string): boolean {
    return this.props.resource === resource && this.props.action === action;
  }

  toJSON(): PermissionProps {
    return { ...this.props };
  }
}
