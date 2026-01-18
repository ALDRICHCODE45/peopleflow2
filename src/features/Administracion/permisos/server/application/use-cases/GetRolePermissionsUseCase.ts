import { prismaPermissionRepository } from "../../infrastructure/repositories/PrismaPermissionRepository";
import prisma from "@lib/prisma";
import { SUPER_ADMIN_PERMISSION_NAME } from "@/core/shared/constants/permissions";

/**
 * Caso de uso: Obtener los IDs de permisos asignados a un rol específico
 *
 * Retorna un array de permissionIds que tiene asignado el rol,
 * útil para preseleccionar checkboxes en la UI de edición de permisos.
 * SEGURIDAD: Excluye el permiso super:admin de los resultados.
 */

export interface GetRolePermissionsInput {
  roleId: string;
}

export interface GetRolePermissionsOutput {
  success: boolean;
  error?: string;
  permissionIds: string[];
}

export class GetRolePermissionsUseCase {
  async execute(
    input: GetRolePermissionsInput
  ): Promise<GetRolePermissionsOutput> {
    try {
      const { roleId } = input;

      if (!roleId) {
        return {
          success: false,
          error: "El roleId es requerido",
          permissionIds: [],
        };
      }

      // Obtener los IDs de permisos asignados al rol, excluyendo super:admin
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId },
        include: {
          permission: {
            select: { id: true, name: true },
          },
        },
      });

      // SEGURIDAD: Filtrar el permiso super:admin
      const permissionIds = rolePermissions
        .filter((rp) => rp.permission.name !== SUPER_ADMIN_PERMISSION_NAME)
        .map((rp) => rp.permissionId);

      return {
        success: true,
        permissionIds,
      };
    } catch (error) {
      console.error("Error in GetRolePermissionsUseCase:", error);
      return {
        success: false,
        error: "Error al obtener los permisos del rol",
        permissionIds: [],
      };
    }
  }
}
