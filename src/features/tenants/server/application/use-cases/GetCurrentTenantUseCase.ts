import { Tenant } from "../../domain/entities/Tenant";
import { ITenantRepository } from "../../domain/interfaces/ITenantRepository";

/**
 * Caso de uso: Obtener el tenant activo de la sesión actual
 */

export interface GetCurrentTenantInput {
  sessionToken: string;
}

export interface GetCurrentTenantOutput {
  success: boolean;
  tenant: Tenant | null;
  error?: string;
}

export class GetCurrentTenantUseCase {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(input: GetCurrentTenantInput): Promise<GetCurrentTenantOutput> {
    try {
      const tenant = await this.tenantRepository.getActiveTenantBySessionToken(
        input.sessionToken
      );

      return {
        success: true,
        tenant,
      };
    } catch (error) {
      console.error("Error in GetCurrentTenantUseCase:", error);
      return {
        success: false,
        tenant: null,
        error: "Error al obtener tenant actual",
      };
    }
  }
}
