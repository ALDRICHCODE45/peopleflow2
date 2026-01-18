import prisma from "@lib/prisma";
import { IUserRoleRepository } from "@/features/auth-rbac/server/domain/interfaces/IUserRoleRepository";

/**
 * Caso de uso: Eliminar un usuario de un tenant
 * IMPORTANTE: Este caso de uso elimina el registro de UserRole, NO el usuario en si
 * El usuario puede seguir existiendo en otros tenants
 */

export interface DeleteUserFromTenantInput {
  userId: string;
  tenantId: string;
  requestingUserId: string;
}

export interface DeleteUserFromTenantOutput {
  success: boolean;
  deletedCount?: number;
  error?: string;
}

export class DeleteUserFromTenantUseCase {
  constructor(private readonly userRoleRepository: IUserRoleRepository) {}

  async execute(input: DeleteUserFromTenantInput): Promise<DeleteUserFromTenantOutput> {
    try {
      // Verificar permisos: superadmin o pertenece al tenant
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
            error: "No tienes permisos para eliminar usuarios de este tenant",
          };
        }
      }

      // Verificar que el usuario existe
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        return {
          success: false,
          error: "Usuario no encontrado",
        };
      }

      // Verificar que el usuario pertenece al tenant
      const userBelongsToTenant = await this.userRoleRepository.userBelongsToTenant(
        input.userId,
        input.tenantId
      );

      if (!userBelongsToTenant) {
        return {
          success: false,
          error: "El usuario no pertenece a este tenant",
        };
      }

      // Prevenir que un usuario se elimine a si mismo del tenant
      if (input.userId === input.requestingUserId) {
        return {
          success: false,
          error: "No puedes eliminarte a ti mismo del tenant",
        };
      }

      // Eliminar TODOS los UserRoles del usuario en este tenant
      // Esto remueve al usuario del tenant sin eliminar su cuenta
      const deleteResult = await prisma.userRole.deleteMany({
        where: {
          userId: input.userId,
          tenantId: input.tenantId,
        },
      });

      return {
        success: true,
        deletedCount: deleteResult.count,
      };
    } catch (error) {
      console.error("Error in DeleteUserFromTenantUseCase:", error);
      return {
        success: false,
        error: "Error al eliminar usuario del tenant",
      };
    }
  }
}
