import { ITenantRepository } from "../../domain/interfaces/ITenantRepository";
import { IUserRoleRepository } from "@/features/auth-rbac/server/domain/interfaces/IUserRoleRepository";

/**
 * Caso de uso: Cambiar el tenant activo en la sesión
 * Verifica que el usuario pueda acceder al tenant antes de cambiar
 */

export interface SwitchTenantInput {
  sessionToken: string;
  userId: string;
  tenantId: string | null;
}

export interface SwitchTenantOutput {
  success: boolean;
  error?: string;
}

export class SwitchTenantUseCase {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly userRoleRepository: IUserRoleRepository
  ) {}

  async execute(input: SwitchTenantInput): Promise<SwitchTenantOutput> {
    try {
      // Si se proporciona un tenantId, verificar que el usuario pueda acceder
      if (input.tenantId) {
        // Verificar si es superadmin (puede acceder a todos los tenants)
        const isSuperAdmin = await this.userRoleRepository.isSuperAdmin(input.userId);

        if (!isSuperAdmin) {
          // Verificar si el usuario pertenece al tenant
          const belongsToTenant = await this.userRoleRepository.userBelongsToTenant(
            input.userId,
            input.tenantId
          );

          if (!belongsToTenant) {
            return {
              success: false,
              error: "No tienes acceso a este tenant",
            };
          }
        }
      }

      // Actualizar la sesión con el nuevo tenant activo
      const updated = await this.tenantRepository.updateSessionActiveTenant(
        input.sessionToken,
        input.tenantId
      );

      if (!updated) {
        return {
          success: false,
          error: "Error al cambiar tenant",
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error in SwitchTenantUseCase:", error);
      return {
        success: false,
        error: "Error al cambiar tenant",
      };
    }
  }
}
