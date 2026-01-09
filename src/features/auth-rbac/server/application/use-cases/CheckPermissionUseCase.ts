import { IRoleRepository } from "../../domain/interfaces/IRoleRepository";
import { PermissionDomainService } from "../../domain/services/PermissionDomainService";

/**
 * Caso de uso: Verificar si un usuario tiene un permiso específico
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
  private readonly permissionService: PermissionDomainService;

  constructor(private readonly roleRepository: IRoleRepository) {
    this.permissionService = new PermissionDomainService();
  }

  async execute(input: CheckPermissionInput): Promise<CheckPermissionOutput> {
    try {
      // Obtener el rol del usuario en el tenant (o global si es superadmin)
      const role = await this.roleRepository.findUserRoleInTenant(
        input.userId,
        input.tenantId
      );

      if (!role) {
        return {
          hasPermission: false,
        };
      }

      // Verificar si el rol tiene el permiso
      const hasPermission = this.permissionService.hasPermission(
        role.name,
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
