import { IUserRoleRepository } from "../../domain/interfaces/IUserRoleRepository";

/**
 * Caso de uso: Obtener todos los permisos del usuario actual en un tenant
 *
 * Obtiene los permisos directamente de la base de datos basándose en:
 * - Los roles asignados al usuario en el tenant
 * - Los permisos asignados a esos roles
 */

export interface GetUserPermissionsInput {
  userId: string;
  tenantId: string | null;
}

export interface GetUserPermissionsOutput {
  success: boolean;
  permissions: string[];
  error?: string;
}

export class GetUserPermissionsUseCase {
  constructor(private readonly userRoleRepository: IUserRoleRepository) {}

  async execute(
    input: GetUserPermissionsInput
  ): Promise<GetUserPermissionsOutput> {
    try {
      // Obtener permisos usando el repositorio
      const permissions = await this.userRoleRepository.getUserPermissions(
        input.userId,
        input.tenantId
      );

      if (permissions.length === 0) {
        return {
          success: false,
          permissions: [],
          error: "No tienes un rol asignado",
        };
      }

      return {
        success: true,
        permissions,
      };
    } catch (error) {
      console.error("Error in GetUserPermissionsUseCase:", error);
      return {
        success: false,
        permissions: [],
        error: "Error al obtener permisos",
      };
    }
  }
}
