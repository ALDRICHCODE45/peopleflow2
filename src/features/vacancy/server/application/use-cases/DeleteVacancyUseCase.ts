import { IVacancyRepository } from "../../domain/interfaces/IVacancyRepository";

export interface DeleteVacancyInput {
  id: string;
  tenantId: string;
}

export interface DeleteVacancyOutput {
  success: boolean;
  error?: string;
}

export class DeleteVacancyUseCase {
  constructor(private readonly vacancyRepository: IVacancyRepository) {}

  async execute(input: DeleteVacancyInput): Promise<DeleteVacancyOutput> {
    try {
      // Verificar que la vacante existe y pertenece al tenant
      const existingVacancy = await this.vacancyRepository.findById(
        input.id,
        input.tenantId
      );

      if (!existingVacancy) {
        return {
          success: false,
          error: "Vacante no encontrada",
        };
      }

      const deleted = await this.vacancyRepository.delete(
        input.id,
        input.tenantId
      );

      if (!deleted) {
        return {
          success: false,
          error: "Error al eliminar vacante",
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error in DeleteVacancyUseCase:", error);
      return {
        success: false,
        error: "Error al eliminar vacante",
      };
    }
  }
}
