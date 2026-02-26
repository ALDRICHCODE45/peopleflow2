import type { IVacancyRepository } from "../../domain/interfaces/IVacancyRepository";

export interface DeleteVacancyInput {
  id: string;
  tenantId: string;
}

export interface DeleteVacancyOutput {
  success: boolean;
  error?: string;
}

export class DeleteVacancyUseCase {
  constructor(private readonly vacancyRepo: IVacancyRepository) {}

  async execute(input: DeleteVacancyInput): Promise<DeleteVacancyOutput> {
    try {
      // Verify vacancy exists and belongs to the tenant
      const existing = await this.vacancyRepo.findById(
        input.id,
        input.tenantId
      );

      if (!existing) {
        return { success: false, error: "Vacante no encontrada" };
      }

      const deleted = await this.vacancyRepo.delete(input.id, input.tenantId);

      if (!deleted) {
        return { success: false, error: "Error al eliminar la vacante" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in DeleteVacancyUseCase:", error);
      return { success: false, error: "Error al eliminar la vacante" };
    }
  }
}
