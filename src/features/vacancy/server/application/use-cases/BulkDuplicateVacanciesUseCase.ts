import type { BulkActionResult } from "../../domain/types/bulk-action.types";
import type { IVacancyRepository } from "../../domain/interfaces/IVacancyRepository";

export interface BulkDuplicateVacanciesInput {
  ids: string[];
  tenantId: string;
}

export interface BulkDuplicateVacanciesOutput {
  success: boolean;
  data?: BulkActionResult;
  error?: string;
}

export class BulkDuplicateVacanciesUseCase {
  constructor(private readonly vacancyRepository: IVacancyRepository) {}

  async execute(input: BulkDuplicateVacanciesInput): Promise<BulkDuplicateVacanciesOutput> {
    try {
      if (input.ids.length === 0) {
        return {
          success: false,
          error: "Debes seleccionar al menos una vacante",
        };
      }

      const result = await this.vacancyRepository.bulkDuplicate(input.ids, input.tenantId);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Error in BulkDuplicateVacanciesUseCase:", error);
      return {
        success: false,
        error: "Error al duplicar vacantes",
      };
    }
  }
}
