import { Permission } from "../entities/Permission";

/**
 * Interfaz del repositorio de Permissions
 * Define el contrato para la capa de infraestructura
 */

export interface IPermissionRepository {
  /**
   * Encuentra un permiso por su ID
   */
  findById(id: string): Promise<Permission | null>;

  /**
   * Encuentra un permiso por su nombre
   */
  findByName(name: string): Promise<Permission | null>;

  /**
   * Obtiene todos los permisos de un rol
   */
  findByRoleId(roleId: string): Promise<Permission[]>;

  /**
   * Obtiene todos los permisos
   */
  findAll(): Promise<Permission[]>;
}
