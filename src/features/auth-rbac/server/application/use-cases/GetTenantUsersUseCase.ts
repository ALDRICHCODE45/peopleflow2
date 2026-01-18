import {
  IUserRoleRepository,
  UserWithRoles,
} from "../../domain/interfaces/IUserRoleRepository";

/**
 * Caso de uso: Obtener todos los usuarios de un tenant
 * Requiere que el usuario sea superadmin o pertenezca al tenant
 */

export interface GetTenantUsersInput {
  tenantId: string;
  requestingUserId: string;
}

export interface GetTenantUsersOutput {
  success: boolean;
  users: UserWithRoles[];
  error?: string;
}

export class GetTenantUsersUseCase {
  constructor(private readonly userRoleRepository: IUserRoleRepository) {}

  async execute(input: GetTenantUsersInput): Promise<GetTenantUsersOutput> {
    try {
      // Verificar autorización: SuperAdmin puede acceder a cualquier tenant
      // O el usuario pertenece al tenant
      const isSuperAdmin = await this.userRoleRepository.isSuperAdmin(
        input.requestingUserId
      );

      if (!isSuperAdmin) {
        const belongsToTenant = await this.userRoleRepository.userBelongsToTenant(
          input.requestingUserId,
          input.tenantId
        );

        if (!belongsToTenant) {
          return {
            success: false,
            users: [],
            error: "No tienes acceso a este tenant",
          };
        }
      }

      // IMPORTANTE: Siempre filtrar datos por el tenantId activo
      // SuperAdmin ve solo usuarios del tenant activo, no de todos

      // Obtener usuarios del tenant (filtrado por tenantId en el repositorio)
      const users = await this.userRoleRepository.findUsersByTenantId(input.tenantId);

      return {
        success: true,
        users,
      };
    } catch (error) {
      console.error("Error in GetTenantUsersUseCase:", error);
      return {
        success: false,
        users: [],
        error: "Error al obtener usuarios",
      };
    }
  }
}
