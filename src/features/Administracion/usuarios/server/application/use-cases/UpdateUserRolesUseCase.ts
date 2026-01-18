import prisma from "@lib/prisma";
import { IUserRoleRepository } from "@/features/auth-rbac/server/domain/interfaces/IUserRoleRepository";
import { IRoleRepository } from "@/features/auth-rbac/server/domain/interfaces/IRoleRepository";
import { HIDDEN_ADMIN_ROLE_NAME } from "@/core/shared/constants/permissions";

/**
 * Caso de uso: Actualizar los roles de un usuario en un tenant
 * Elimina los roles existentes del usuario en el tenant y crea los nuevos
 */

export interface UpdateUserRolesInput {
  userId: string;
  tenantId: string;
  requestingUserId: string;
  roleIds: string[];
}

export interface UpdateUserRolesOutput {
  success: boolean;
  assignedRoles?: Array<{
    id: string;
    roleId: string;
    roleName: string;
  }>;
  error?: string;
}

export class UpdateUserRolesUseCase {
  constructor(
    private readonly userRoleRepository: IUserRoleRepository,
    private readonly roleRepository: IRoleRepository
  ) {}

  async execute(input: UpdateUserRolesInput): Promise<UpdateUserRolesOutput> {
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
            error: "No tienes permisos para actualizar roles en este tenant",
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

      // Validar que se proporciono al menos un rol
      if (!input.roleIds || input.roleIds.length === 0) {
        return {
          success: false,
          error: "Debe asignar al menos un rol al usuario",
        };
      }

      // Verificar que todos los roles existen Y pertenecen al tenant (o son globales)
      const roles = await prisma.role.findMany({
        where: {
          id: { in: input.roleIds },
          OR: [
            { tenantId: input.tenantId },
            { tenantId: null }  // Roles globales
          ]
        },
      });

      if (roles.length !== input.roleIds.length) {
        return {
          success: false,
          error: "Uno o más roles no son válidos para este tenant",
        };
      }

      // Prevenir asignación de rol administrador (super:admin) a través de este use case
      const adminRole = roles.find((role) => role.name === HIDDEN_ADMIN_ROLE_NAME);
      if (adminRole) {
        return {
          success: false,
          error: "No se puede asignar el rol de administrador a través de este método",
        };
      }

      // Usar transaccion para eliminar roles existentes y crear nuevos
      const result = await prisma.$transaction(async (tx) => {
        // Eliminar todos los roles existentes del usuario en este tenant
        await tx.userRole.deleteMany({
          where: {
            userId: input.userId,
            tenantId: input.tenantId,
          },
        });

        // Crear los nuevos roles
        const createdUserRoles = await Promise.all(
          input.roleIds.map((roleId) =>
            tx.userRole.create({
              data: {
                userId: input.userId,
                roleId: roleId,
                tenantId: input.tenantId,
              },
              include: {
                role: true,
              },
            })
          )
        );

        return createdUserRoles;
      });

      return {
        success: true,
        assignedRoles: result.map((userRole) => ({
          id: userRole.id,
          roleId: userRole.roleId,
          roleName: userRole.role.name,
        })),
      };
    } catch (error) {
      console.error("Error in UpdateUserRolesUseCase:", error);
      return {
        success: false,
        error: "Error al actualizar los roles del usuario",
      };
    }
  }
}
