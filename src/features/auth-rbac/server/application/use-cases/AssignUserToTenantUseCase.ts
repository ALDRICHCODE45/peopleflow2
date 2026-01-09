import prisma from "@lib/prisma";
import { IRoleRepository } from "../../domain/interfaces/IRoleRepository";
import { IUserRoleRepository } from "../../domain/interfaces/IUserRoleRepository";

/**
 * Caso de uso: Asignar un usuario a un tenant con un rol específico
 * Solo puede ser ejecutado por superadmin (validado en la capa de presentación)
 */

export interface AssignUserToTenantInput {
  userId: string;
  tenantId: string;
  roleName: string;
}

export interface AssignUserToTenantOutput {
  success: boolean;
  userRole?: {
    id: string;
    userId: string;
    tenantId: string;
    roleId: string;
  };
  error?: string;
}

export class AssignUserToTenantUseCase {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly userRoleRepository: IUserRoleRepository
  ) {}

  async execute(input: AssignUserToTenantInput): Promise<AssignUserToTenantOutput> {
    try {
      // Obtener el rol
      const role = await this.roleRepository.findByName(input.roleName);

      if (!role) {
        return {
          success: false,
          error: "Rol no encontrado",
        };
      }

      // Verificar que el tenant existe
      const tenant = await prisma.tenant.findUnique({
        where: { id: input.tenantId },
      });

      if (!tenant) {
        return {
          success: false,
          error: "Tenant no encontrado",
        };
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

      // Verificar si ya existe esta asignación
      const existingUserRole = await this.userRoleRepository.exists(
        input.userId,
        role.id,
        input.tenantId
      );

      if (existingUserRole) {
        return {
          success: false,
          error: "El usuario ya tiene este rol en este tenant",
        };
      }

      // Crear la asignación
      const userRole = await this.userRoleRepository.create({
        userId: input.userId,
        roleId: role.id,
        tenantId: input.tenantId,
      });

      return {
        success: true,
        userRole: {
          id: userRole.id,
          userId: userRole.userId,
          tenantId: userRole.tenantId!,
          roleId: userRole.roleId,
        },
      };
    } catch (error) {
      console.error("Error in AssignUserToTenantUseCase:", error);
      return {
        success: false,
        error: "Error al asignar usuario a tenant",
      };
    }
  }
}
