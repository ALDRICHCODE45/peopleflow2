import type { IVacancyRepository } from "../../domain/interfaces/IVacancyRepository";

export interface DuplicateVacancyInput {
  vacancyId: string;
  tenantId: string;
}

export interface DuplicateVacancyOutput {
  success: boolean;
  data?: { id: string };
  error?: string;
}

export class DuplicateVacancyUseCase {
  constructor(private readonly vacancyRepository: IVacancyRepository) {}

  async execute(input: DuplicateVacancyInput): Promise<DuplicateVacancyOutput> {
    try {
      const existingVacancy = await this.vacancyRepository.findById(
        input.vacancyId,
        input.tenantId,
      );

      if (!existingVacancy) {
        return {
          success: false,
          error: "La vacante no existe o no pertenece al tenant activo",
        };
      }

      const result = await this.vacancyRepository.bulkDuplicate(
        [input.vacancyId],
        input.tenantId,
      );

      if (result.succeeded.length === 0) {
        return {
          success: false,
          error: result.failed[0]?.reason ?? "No se pudo duplicar la vacante",
        };
      }

      return {
        success: true,
        data: { id: result.succeeded[0] },
      };
    } catch (error) {
      console.error("Error in DuplicateVacancyUseCase:", error);
      return {
        success: false,
        error: "Error al duplicar la vacante",
      };
    }
  }
}
