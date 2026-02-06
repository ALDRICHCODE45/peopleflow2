import { UserRole } from "../entities/UserRole";
import type { SortingParam } from "@/core/shared/types/pagination.types";

/**
 * Interfaz del repositorio de UserRoles
 * Define el contrato para la capa de infraestructura
 */

export interface UserWithRoles {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  avatar: string | null;
  roles: Array<{ id: string; name: string }>;
  createdAt?: Date;
}

/** Parámetros para búsqueda paginada de usuarios */
export interface FindPaginatedUsersParams {
  tenantId: string;
  skip: number;
  take: number;
  sorting?: SortingParam[];
  filters?: {
    search?: string;
  };
}

/** Resultado de búsqueda paginada de usuarios */
export interface PaginatedUsersResult {
  data: UserWithRoles[];
  totalCount: number;
}

export interface CreateUserRoleData {
  userId: string;
  roleId: string;
  tenantId: string | null;
}

export interface IUserRoleRepository {
  /**
   * Encuentra un UserRole por su ID con filtrado de tenant
   * SEGURIDAD: Requiere tenantId para prevenir acceso cross-tenant
   * @param id - ID del UserRole
   * @param tenantId - ID del tenant (null para roles globales de SuperAdmin)
   */
  findById(id: string, tenantId: string | null): Promise<UserRole | null>;

  /**
   * Verifica si existe una asignación de usuario-rol-tenant
   */
  exists(
    userId: string,
    roleId: string,
    tenantId: string | null
  ): Promise<boolean>;

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
   * Busca un usuario por ID
   */
  findUserById(
    userId: string
  ): Promise<{ name: string; id: string; email: string; image: string | null; avatar: string | null } | null>;

  /**
   * Obtiene todos los permisos de un usuario en un tenant específico
   * Si tenantId es null, busca roles globales (como super:admin)
   */
  getUserPermissions(
    userId: string,
    tenantId: string | null
  ): Promise<string[]>;

  /**
   * Obtiene usuarios de un tenant con paginación server-side
   * Soporta búsqueda por email/name y ordenamiento
   */
  findPaginatedUsers(
    params: FindPaginatedUsersParams
  ): Promise<PaginatedUsersResult>;
}
