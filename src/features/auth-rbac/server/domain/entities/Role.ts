/**
 * Entidad de dominio Role
 * Representa un rol en el sistema RBAC
 */

export interface RoleProps {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Role {
  private readonly props: RoleProps;

  constructor(props: RoleProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Verifica si este rol es superadmin
   */
  isSuperAdmin(): boolean {
    return this.props.name === "superadmin";
  }

  toJSON(): RoleProps {
    return { ...this.props };
  }
}
