import { prismaPermissionRepository } from "../../infrastructure/repositories/PrismaPermissionRepository";
import { prismaUserRoleRepository } from "@/features/auth-rbac/server/infrastructure/repositories/PrismaUserRoleRepository";
import { PermissionService } from "@/core/lib/permissions/permission.service";
import prisma from "@lib/prisma";
import { SUPER_ADMIN_PERMISSION_NAME } from "@/core/shared/constants/permissions";

/**
 * Caso de uso: Asignar permisos a un rol
 *
 * Solo usuarios con permiso super:admin o roles:asignar-permisos pueden ejecutar
 * Utiliza una transaccion para eliminar permisos existentes y crear los nuevos.
 * SEGURIDAD: No permite asignar el permiso super:admin desde la UI.
 */

export interface AssignPermissionsToRoleInput {
  userId: string;
  tenantId: string | null;
  roleId: string;
  permissionIds: string[];
}

export interface AssignPermissionsToRoleOutput {
  success: boolean;
  error?: string;
}

export class AssignPermissionsToRoleUseCase {
  async execute(
    input: AssignPermissionsToRoleInput
  ): Promise<AssignPermissionsToRoleOutput> {
    try {
      const { userId, tenantId, roleId, permissionIds } = input;

      // Validar inputs requeridos
      if (!roleId) {
        return {
          success: false,
          error: "El roleId es requerido",
        };
      }

      if (!Array.isArray(permissionIds)) {
        return {
          success: false,
          error: "permissionIds debe ser un array",
        };
      }

      // Verificar si el usuario tiene permiso para asignar permisos
      const hasPermission = await this.checkUserPermission(userId, tenantId);

      if (!hasPermission) {
        return {
          success: false,
          error: "No tienes permiso para asignar permisos a roles",
        };
      }

      // SEGURIDAD: Obtener el ID del permiso super:admin para filtrarlo
      const superAdminPermission = await prisma.permission.findUnique({
        where: { name: SUPER_ADMIN_PERMISSION_NAME },
        select: { id: true },
      });

      // Filtrar el permiso super:admin de los IDs (no debe ser asignable desde UI)
      const safePermissionIds = superAdminPermission
        ? permissionIds.filter((id) => id !== superAdminPermission.id)
        : permissionIds;

      // Asignar permisos al rol (reemplaza los existentes, sin super:admin)
      await prismaPermissionRepository.assignPermissionsToRole(
        roleId,
        safePermissionIds
      );

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error in AssignPermissionsToRoleUseCase:", error);
      return {
        success: false,
        error: "Error al asignar permisos al rol",
      };
    }
  }

  /**
   * Verifica si el usuario tiene permiso para asignar permisos
   * Requiere ser superadmin O tener el permiso roles:asignar-permisos
   */
  private async checkUserPermission(
    userId: string,
    tenantId: string | null
  ): Promise<boolean> {
    // Verificar si es superadmin
    const isSuperAdmin = await prismaUserRoleRepository.isSuperAdmin(userId);

    if (isSuperAdmin) {
      return true;
    }

    // Verificar si tiene el permiso roles:asignar-permisos
    const userPermissions = await prismaUserRoleRepository.getUserPermissions(
      userId,
      tenantId
    );

    return PermissionService.hasPermission(
      userPermissions,
      "roles:asignar-permisos"
    );
  }
}
