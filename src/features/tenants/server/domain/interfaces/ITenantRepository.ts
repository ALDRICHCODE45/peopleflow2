import { Tenant } from "../entities/Tenant";

/**
 * Interfaz del repositorio de Tenants
 * Define el contrato para la capa de infraestructura
 */

export interface TenantWithRoles {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{ id: string; name: string }>;
}

export interface CreateTenantData {
  name: string;
  slug: string;
}

export interface ITenantRepository {
  /**
   * Obtiene todos los tenants del sistema (solo superadmin)
   */
  findAll(): Promise<Tenant[]>;

  /**
   * Encuentra un tenant por su ID
   */
  findById(id: string): Promise<Tenant | null>;

  /**
   * Encuentra un tenant por su nombre
   */
  findByName(name: string): Promise<Tenant | null>;

  /**
   * Encuentra un tenant por su slug
   */
  findBySlug(slug: string): Promise<Tenant | null>;

  /**
   * Encuentra un tenant por nombre o slug
   */
  findByNameOrSlug(name: string, slug: string): Promise<Tenant | null>;

  /**
   * Obtiene todos los tenants a los que pertenece un usuario
   */
  findByUserId(userId: string): Promise<TenantWithRoles[]>;

  /**
   * Crea un nuevo tenant
   */
  create(data: CreateTenantData): Promise<Tenant>;

  /**
   * Obtiene el tenant activo de una sesión
   */
  getActiveTenantBySessionToken(sessionToken: string): Promise<Tenant | null>;

  /**
   * Actualiza el tenant activo en una sesión
   */
  updateSessionActiveTenant(
    sessionToken: string,
    tenantId: string | null,
  ): Promise<boolean>;
}
