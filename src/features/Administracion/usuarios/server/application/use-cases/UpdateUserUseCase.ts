import prisma from "@lib/prisma";
import { IUserRoleRepository } from "@/features/auth-rbac/server/domain/interfaces/IUserRoleRepository";

/**
 * Caso de uso: Actualizar datos de un usuario
 * Permite actualizar nombre y email de un usuario
 * Requiere que el usuario solicitante sea superadmin o pertenezca al tenant
 */

export interface UpdateUserInput {
  userId: string;
  tenantId: string;
  requestingUserId: string;
  name?: string;
  email?: string;
}

export interface UpdateUserOutput {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
  error?: string;
}

export class UpdateUserUseCase {
  constructor(private readonly userRoleRepository: IUserRoleRepository) {}

  async execute(input: UpdateUserInput): Promise<UpdateUserOutput> {
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
            error: "No tienes permisos para actualizar usuarios en este tenant",
          };
        }
      }

      // Verificar que el usuario a actualizar existe
      const existingUser = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!existingUser) {
        return {
          success: false,
          error: "Usuario no encontrado",
        };
      }

      // Verificar que el usuario pertenece al tenant (excepto si es superadmin)
      if (!isSuperAdmin) {
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
      }

      // Verificar si se quiere cambiar el email y si ya existe
      if (input.email && input.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: input.email },
        });

        if (emailExists) {
          return {
            success: false,
            error: "El email ya esta en uso por otro usuario",
          };
        }
      }

      // Preparar datos para actualizar
      const updateData: { name?: string; email?: string } = {};
      if (input.name !== undefined) {
        updateData.name = input.name;
      }
      if (input.email !== undefined) {
        updateData.email = input.email;
      }

      // Si no hay nada que actualizar
      if (Object.keys(updateData).length === 0) {
        return {
          success: false,
          error: "No se proporcionaron datos para actualizar",
        };
      }

      // Actualizar usuario
      const updatedUser = await prisma.user.update({
        where: { id: input.userId },
        data: updateData,
      });

      return {
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
        },
      };
    } catch (error) {
      console.error("Error in UpdateUserUseCase:", error);
      return {
        success: false,
        error: "Error al actualizar el usuario",
      };
    }
  }
}
