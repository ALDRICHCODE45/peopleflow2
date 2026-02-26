import type {
  IVacancyConfigRepository,
  UpsertVacancyConfigData,
  VacancyConfigData,
} from "../../domain/interfaces/IVacancyConfigRepository";

export type UpsertVacancyConfigInput = {
  tenantId: string;
} & UpsertVacancyConfigData;

export interface UpsertVacancyConfigOutput {
  success: boolean;
  config?: VacancyConfigData;
  error?: string;
}

export class UpsertVacancyConfigUseCase {
  constructor(private readonly configRepo: IVacancyConfigRepository) {}

  async execute(
    input: UpsertVacancyConfigInput
  ): Promise<UpsertVacancyConfigOutput> {
    try {
      const { tenantId, ...data } = input;

      // 1. Validate quickMeetingSlaHours if provided
      if (data.quickMeetingSlaHours !== undefined) {
        if (data.quickMeetingSlaHours < 1) {
          return {
            success: false,
            error: "El SLA de Quick Meeting debe ser al menos 1 hora",
          };
        }
        if (data.quickMeetingSlaHours > 168) {
          return {
            success: false,
            error: "El SLA de Quick Meeting no puede exceder 168 horas (1 semana)",
          };
        }
      }

      // 2. Upsert config
      const config = await this.configRepo.upsert(tenantId, data);

      return { success: true, config };
    } catch (error) {
      console.error("Error in UpsertVacancyConfigUseCase:", error);
      return {
        success: false,
        error: "Error al guardar la configuración de vacantes",
      };
    }
  }
}
