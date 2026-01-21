import { IUserRoleRepository } from "../../domain/interfaces/IUserRoleRepository";
import { PermissionService } from "@/core/lib/permissions/permission.service";
import { PrismaUserRoleRepository } from "../../infrastructure/repositories/PrismaUserRoleRepository";

/**
 * Caso de uso: Verificar si un usuario tiene al menos uno de los permisos específicados
 *
 * Este caso de uso obtiene los permisos del usuario desde la BD
 * y utiliza el PermissionService centralizado para verificar los permisos.
 */

export interface CheckAnyPermissonInput {
  userId: string;
  permissions: string[];
  tenantId: string | null;
}

export interface CheckAnyPermissionOutput {
  hasAnyPermission: boolean;
  error?: string;
}

export class CheckAnyPermissonUseCase {
  private readonly userRoleRepository: IUserRoleRepository;

  constructor() {
    this.userRoleRepository = new PrismaUserRoleRepository();
  }

  async execute(
    input: CheckAnyPermissonInput,
  ): Promise<CheckAnyPermissionOutput> {
    try {
      // Obtener los permisos del usuario en el tenant
      const userPermissions = await this.userRoleRepository.getUserPermissions(
        input.userId,
        input.tenantId,
      );

      // Si no tiene permisos, no tiene acceso
      if (userPermissions.length === 0) {
        return {
          hasAnyPermission: false,
          error: "El usuario no tiene permisos",
        };
      }

      // Verificar si tiene el permiso usando el servicio centralizado
      const hasAnyPermission = input.permissions.some((permission) =>
        PermissionService.hasPermission(userPermissions, permission),
      );

      if (!hasAnyPermission) {
        return {
          hasAnyPermission: false,
          error: "El usuario no tiene los permisos necesarios",
        };
      }

      return {
        hasAnyPermission,
      };
    } catch (error) {
      console.error("Error in CheckPermissionUseCase:", error);
      return {
        hasAnyPermission: false,
        error: "Error al verificar permiso",
      };
    }
  }
}

const checker = await new CheckAnyPermissonUseCase().execute({
  permissions: ["", ""],
  tenantId: "",
  userId: "",
});
