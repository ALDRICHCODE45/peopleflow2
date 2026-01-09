import { Role } from "../entities/Role";

/**
 * Interfaz del repositorio de Roles
 * Define el contrato para la capa de infraestructura
 */

export interface IRoleRepository {
  /**
   * Encuentra un rol por su ID
   */
  findById(id: string): Promise<Role | null>;

  /**
   * Encuentra un rol por su nombre
   */
  findByName(name: string): Promise<Role | null>;

  /**
   * Obtiene el rol de un usuario en un tenant específico
   */
  findUserRoleInTenant(userId: string, tenantId: string | null): Promise<Role | null>;

  /**
   * Verifica si un usuario tiene un rol específico globalmente (sin tenant)
   */
  hasGlobalRole(userId: string, roleId: string): Promise<boolean>;

  /**
   * Obtiene todos los roles
   */
  findAll(): Promise<Role[]>;
}
