import prisma from "@lib/prisma";
import { IUserRoleRepository } from "@/features/auth-rbac/server/domain/interfaces/IUserRoleRepository";

/**
 * Caso de uso: Crear un nuevo rol
 * Solo SuperAdmin puede crear roles
 * Los roles se crean asociados al tenant activo
 */

export interface CreateRoleInput {
  requestingUserId: string;
  name: string;
  tenantId: string;
}

export interface CreateRoleOutput {
  success: boolean;
  error?: string;
  role?: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export class CreateRoleUseCase {
  constructor(private readonly userRoleRepository: IUserRoleRepository) {}

  async execute(input: CreateRoleInput): Promise<CreateRoleOutput> {
    try {
      // 1. Verificar que el usuario solicitante sea superadmin
      const isSuperAdmin = await this.userRoleRepository.isSuperAdmin(
        input.requestingUserId
      );

      if (!isSuperAdmin) {
        return {
          success: false,
          error: "No tienes permisos para crear roles. Solo SuperAdmin puede hacerlo.",
        };
      }

      // 2. Validar el nombre del rol
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

      // 3. Verificar que no exista un rol con el mismo nombre en el tenant
      const existingRole = await prisma.role.findUnique({
        where: {
          name_tenantId: {
            name,
            tenantId: input.tenantId,
          },
        },
      });

      if (existingRole) {
        return {
          success: false,
          error: "Ya existe un rol con ese nombre en este tenant",
        };
      }

      // 4. Crear el nuevo rol asociado al tenant
      const newRole = await prisma.role.create({
        data: {
          name,
          tenantId: input.tenantId,
        },
      });

      return {
        success: true,
        role: {
          id: newRole.id,
          name: newRole.name,
          createdAt: newRole.createdAt,
          updatedAt: newRole.updatedAt,
        },
      };
    } catch (error) {
      console.error("Error in CreateRoleUseCase:", error);
      return {
        success: false,
        error: "Error al crear el rol",
      };
    }
  }
}
