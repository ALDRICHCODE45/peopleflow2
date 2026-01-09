/**
 * Entidad de dominio UserRole
 * Representa la asignación de un rol a un usuario en un tenant
 */

export interface UserRoleProps {
  id: string;
  userId: string;
  roleId: string;
  tenantId: string | null;
  createdAt: Date;
}

export class UserRole {
  private readonly props: UserRoleProps;

  constructor(props: UserRoleProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get roleId(): string {
    return this.props.roleId;
  }

  get tenantId(): string | null {
    return this.props.tenantId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /**
   * Verifica si este UserRole es global (sin tenant específico)
   */
  isGlobal(): boolean {
    return this.props.tenantId === null;
  }

  toJSON(): UserRoleProps {
    return { ...this.props };
  }
}
