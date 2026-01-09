import { UserRole } from "../entities/UserRole";

/**
 * Interfaz del repositorio de UserRoles
 * Define el contrato para la capa de infraestructura
 */

export interface UserWithRoles {
  id: string;
  email: string;
  name: string | null;
  roles: Array<{ id: string; name: string }>;
}

export interface CreateUserRoleData {
  userId: string;
  roleId: string;
  tenantId: string | null;
}

export interface IUserRoleRepository {
  /**
   * Encuentra un UserRole por su ID
   */
  findById(id: string): Promise<UserRole | null>;

  /**
   * Verifica si existe una asignación de usuario-rol-tenant
   */
  exists(userId: string, roleId: string, tenantId: string | null): Promise<boolean>;

  /**
   * Crea una nueva asignación de rol a usuario
   */
  create(data: CreateUserRoleData): Promise<UserRole>;

  /**
   * Obtiene todos los usuarios de un tenant con sus roles
   */
  findUsersByTenantId(tenantId: string): Promise<UserWithRoles[]>;

  /**
   * Verifica si un usuario pertenece a un tenant
   */
  userBelongsToTenant(userId: string, tenantId: string): Promise<boolean>;

  /**
   * Verifica si un usuario es superadmin
   */
  isSuperAdmin(userId: string): Promise<boolean>;

  /**
   * Obtiene todos los permisos de un usuario en un tenant específico
   * Si tenantId es null, busca roles globales (como super:admin)
   */
  getUserPermissions(userId: string, tenantId: string | null): Promise<string[]>;
}
