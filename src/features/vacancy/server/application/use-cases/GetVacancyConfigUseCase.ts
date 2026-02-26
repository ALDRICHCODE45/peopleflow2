import type {
  IVacancyConfigRepository,
  VacancyConfigData,
} from "../../domain/interfaces/IVacancyConfigRepository";

export interface GetVacancyConfigInput {
  tenantId: string;
}

export interface GetVacancyConfigOutput {
  success: boolean;
  config?: VacancyConfigData | null;
  error?: string;
}

export class GetVacancyConfigUseCase {
  constructor(private readonly configRepo: IVacancyConfigRepository) {}

  async execute(input: GetVacancyConfigInput): Promise<GetVacancyConfigOutput> {
    try {
      // null is valid — tenant may not have configured it yet
      const config = await this.configRepo.findByTenantId(input.tenantId);
      return { success: true, config };
    } catch (error) {
      console.error("Error in GetVacancyConfigUseCase:", error);
      return {
        success: false,
        error: "Error al obtener la configuración de vacantes",
      };
    }
  }
}
