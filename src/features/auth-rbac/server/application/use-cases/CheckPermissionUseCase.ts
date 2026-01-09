import { IUserRoleRepository } from "../../domain/interfaces/IUserRoleRepository";
import { PermissionService } from "@/core/lib/permissions/permission.service";

/**
 * Caso de uso: Verificar si un usuario tiene un permiso específico
 *
 * Este caso de uso obtiene los permisos del usuario desde la BD
 * y utiliza el PermissionService centralizado para verificar el permiso.
 */

export interface CheckPermissionInput {
  userId: string;
  permission: string;
  tenantId: string | null;
}

export interface CheckPermissionOutput {
  hasPermission: boolean;
  error?: string;
}

export class CheckPermissionUseCase {
  constructor(private readonly userRoleRepository: IUserRoleRepository) {}

  async execute(input: CheckPermissionInput): Promise<CheckPermissionOutput> {
    try {
      // Obtener los permisos del usuario en el tenant
      const userPermissions = await this.userRoleRepository.getUserPermissions(
        input.userId,
        input.tenantId
      );

      // Si no tiene permisos, no tiene acceso
      if (userPermissions.length === 0) {
        return {
          hasPermission: false,
        };
      }

      // Verificar si tiene el permiso usando el servicio centralizado
      const hasPermission = PermissionService.hasPermission(
        userPermissions,
        input.permission
      );

      return {
        hasPermission,
      };
    } catch (error) {
      console.error("Error in CheckPermissionUseCase:", error);
      return {
        hasPermission: false,
        error: "Error al verificar permiso",
      };
    }
  }
}
