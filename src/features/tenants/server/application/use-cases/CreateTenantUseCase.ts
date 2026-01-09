import { Tenant } from "../../domain/entities/Tenant";
import { ITenantRepository } from "../../domain/interfaces/ITenantRepository";
import { TenantDomainService } from "../../domain/services/TenantDomainService";

/**
 * Caso de uso: Crear un nuevo tenant
 * Solo puede ser ejecutado por superadmin (validado en la capa de presentación)
 */

export interface CreateTenantInput {
  name: string;
  slug?: string;
}

export interface CreateTenantOutput {
  success: boolean;
  tenant?: Tenant;
  error?: string;
}

export class CreateTenantUseCase {
  private readonly domainService: TenantDomainService;

  constructor(private readonly tenantRepository: ITenantRepository) {
    this.domainService = new TenantDomainService();
  }

  async execute(input: CreateTenantInput): Promise<CreateTenantOutput> {
    try {
      // Validar datos de entrada
      const validation = this.domainService.validateCreateTenantData(
        input.name,
        input.slug,
      );

      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Generar slug si no se proporciona
      const slug =
        input.slug || this.domainService.generateSlugFromName(input.name);

      // Verificar que el nombre y slug sean únicos
      const existingTenant = await this.tenantRepository.findByNameOrSlug(
        input.name,
        slug,
      );

      if (existingTenant) {
        return {
          success: false,
          error: "Ya existe un tenant con ese nombre o slug",
        };
      }

      // Crear el tenant
      const tenant = await this.tenantRepository.create({
        name: input.name,
        slug,
      });

      return {
        success: true,
        tenant,
      };
    } catch (error) {
      console.error("Error in CreateTenantUseCase:", error);
      return {
        success: false,
        error: "Error al crear tenant",
      };
    }
  }
}
