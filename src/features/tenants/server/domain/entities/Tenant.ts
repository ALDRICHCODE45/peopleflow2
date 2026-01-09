/**
 * Entidad de dominio Tenant
 * Representa una organización/empresa en el sistema multi-tenant
 */

export interface TenantProps {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Tenant {
  private readonly props: TenantProps;

  constructor(props: TenantProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Genera un slug a partir del nombre
   */
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  /**
   * Valida si el slug tiene formato correcto
   */
  static isValidSlug(slug: string): boolean {
    return /^[a-z0-9-]+$/.test(slug);
  }

  toJSON(): TenantProps {
    return { ...this.props };
  }
}
