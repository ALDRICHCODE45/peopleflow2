import { ITenantRepository, TenantWithRoles } from "../../domain/interfaces/ITenantRepository";

/**
 * Caso de uso: Obtener los tenants de un usuario
 * Retorna todos los tenants a los que pertenece un usuario con sus roles
 */

export interface GetUserTenantsInput {
  userId: string;
}

export interface GetUserTenantsOutput {
  success: boolean;
  tenants: TenantWithRoles[];
  error?: string;
}

export class GetUserTenantsUseCase {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(input: GetUserTenantsInput): Promise<GetUserTenantsOutput> {
    try {
      const tenants = await this.tenantRepository.findByUserId(input.userId);

      return {
        success: true,
        tenants,
      };
    } catch (error) {
      console.error("Error in GetUserTenantsUseCase:", error);
      return {
        success: false,
        tenants: [],
        error: "Error al obtener tenants del usuario",
      };
    }
  }
}
