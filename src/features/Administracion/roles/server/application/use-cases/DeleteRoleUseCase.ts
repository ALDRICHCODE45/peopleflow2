import prisma from "@lib/prisma";
import { IUserRoleRepository } from "@/features/auth-rbac/server/domain/interfaces/IUserRoleRepository";

/**
 * Caso de uso: Eliminar un rol
 * Solo SuperAdmin puede eliminar roles
 * No se puede eliminar si tiene usuarios asignados
 */

export interface DeleteRoleInput {
  requestingUserId: string;
  roleId: string;
  tenantId: string;
}

export interface DeleteRoleOutput {
  success: boolean;
  error?: string;
}

export class DeleteRoleUseCase {
  constructor(private readonly userRoleRepository: IUserRoleRepository) {}

  async execute(input: DeleteRoleInput): Promise<DeleteRoleOutput> {
    try {
      // 1. Verificar que el usuario solicitante sea superadmin
      const isSuperAdmin = await this.userRoleRepository.isSuperAdmin(
        input.requestingUserId
      );

      if (!isSuperAdmin) {
        return {
          success: false,
          error: "No tienes permisos para eliminar roles. Solo SuperAdmin puede hacerlo.",
        };
      }

      // 2. Verificar que el rol existe
      const existingRole = await prisma.role.findUnique({
        where: { id: input.roleId },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      if (!existingRole) {
        return {
          success: false,
          error: "El rol no existe",
        };
      }

      // 3. Verificar que no se intente eliminar el rol superadmin
      if (existingRole.name === "superadmin") {
        return {
          success: false,
          error: "No se puede eliminar el rol superadmin",
        };
      }

      // 4. Verificar que el rol pertenece al tenant activo o es global
      if (existingRole.tenantId !== null && existingRole.tenantId !== input.tenantId) {
        return {
          success: false,
          error: "No tienes permisos para eliminar este rol",
        };
      }

      // 5. Verificar que el rol no tenga usuarios asignados
      if (existingRole._count.users > 0) {
        return {
          success: false,
          error: `No se puede eliminar el rol porque tiene ${existingRole._count.users} usuario(s) asignado(s). Reasigna los usuarios a otro rol primero.`,
        };
      }

      // 6. Eliminar primero las relaciones con permisos (RolePermission)
      await prisma.rolePermission.deleteMany({
        where: { roleId: input.roleId },
      });

      // 7. Eliminar el rol
      await prisma.role.delete({
        where: { id: input.roleId },
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error in DeleteRoleUseCase:", error);
      return {
        success: false,
        error: "Error al eliminar el rol",
      };
    }
  }
}
