import prisma from "@lib/prisma";
import { IUserRoleRepository } from "@/features/auth-rbac/server/domain/interfaces/IUserRoleRepository";

/**
 * Caso de uso: Actualizar el nombre de un rol
 * Solo SuperAdmin puede actualizar roles
 */

export interface UpdateRoleInput {
  requestingUserId: string;
  roleId: string;
  name: string;
}

export interface UpdateRoleOutput {
  success: boolean;
  error?: string;
  role?: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export class UpdateRoleUseCase {
  constructor(private readonly userRoleRepository: IUserRoleRepository) {}

  async execute(input: UpdateRoleInput): Promise<UpdateRoleOutput> {
    try {
      // 1. Verificar que el usuario solicitante sea superadmin
      const isSuperAdmin = await this.userRoleRepository.isSuperAdmin(
        input.requestingUserId
      );

      if (!isSuperAdmin) {
        return {
          success: false,
          error: "No tienes permisos para actualizar roles. Solo SuperAdmin puede hacerlo.",
        };
      }

      // 2. Verificar que el rol existe
      const existingRole = await prisma.role.findUnique({
        where: { id: input.roleId },
      });

      if (!existingRole) {
        return {
          success: false,
          error: "El rol no existe",
        };
      }

      // 3. Verificar que no se intente modificar el rol superadmin
      if (existingRole.name === "superadmin") {
        return {
          success: false,
          error: "No se puede modificar el rol superadmin",
        };
      }

      // 4. Validar el nuevo nombre del rol
      const name = input.name?.trim() || "";

      if (name.length < 2) {
        return {
          success: false,
          error: "El nombre del rol debe tener al menos 2 caracteres",
        };
      }

      if (name.length > 50) {
        return {
          success: false,
          error: "El nombre del rol no puede exceder 50 caracteres",
        };
      }

      // 5. Verificar que no exista otro rol con el mismo nombre en el mismo tenant
      const duplicateRole = await prisma.role.findFirst({
        where: {
          name,
          tenantId: existingRole.tenantId,
          id: { not: input.roleId },
        },
      });

      if (duplicateRole) {
        return {
          success: false,
          error: "Ya existe otro rol con ese nombre en este tenant",
        };
      }

      // 6. Actualizar el rol
      const updatedRole = await prisma.role.update({
        where: { id: input.roleId },
        data: { name },
      });

      return {
        success: true,
        role: {
          id: updatedRole.id,
          name: updatedRole.name,
          createdAt: updatedRole.createdAt,
          updatedAt: updatedRole.updatedAt,
        },
      };
    } catch (error) {
      console.error("Error in UpdateRoleUseCase:", error);
      return {
        success: false,
        error: "Error al actualizar el rol",
      };
    }
  }
}
