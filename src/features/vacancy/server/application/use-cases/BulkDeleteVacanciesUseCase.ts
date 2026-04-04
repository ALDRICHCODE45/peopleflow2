import type { BulkActionResult } from "../../domain/types/bulk-action.types";
import type { IVacancyRepository } from "../../domain/interfaces/IVacancyRepository";

export interface BulkDeleteVacanciesInput {
  ids: string[];
  tenantId: string;
}

export interface BulkDeleteVacanciesOutput {
  success: boolean;
  data?: BulkActionResult;
  error?: string;
}

export class BulkDeleteVacanciesUseCase {
  constructor(private readonly vacancyRepository: IVacancyRepository) {}

  async execute(input: BulkDeleteVacanciesInput): Promise<BulkDeleteVacanciesOutput> {
    try {
      if (input.ids.length === 0) {
        return {
          success: false,
          error: "Debes seleccionar al menos una vacante",
        };
      }

      const result = await this.vacancyRepository.bulkDelete(input.ids, input.tenantId);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Error in BulkDeleteVacanciesUseCase:", error);
      return {
        success: false,
        error: "Error al eliminar vacantes",
      };
    }
  }
}
