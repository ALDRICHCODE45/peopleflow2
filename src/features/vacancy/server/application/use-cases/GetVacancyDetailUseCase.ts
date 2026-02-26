import type { VacancyDTO } from "@features/vacancy/frontend/types/vacancy.types";
import type { IVacancyRepository } from "../../domain/interfaces/IVacancyRepository";

export interface GetVacancyDetailInput {
  id: string;
  tenantId: string;
}

export interface GetVacancyDetailOutput {
  success: boolean;
  vacancy?: VacancyDTO;
  error?: string;
}

/**
 * Retorna el detalle completo de una vacante como DTO.
 * Incluye relaciones (candidates, checklistItems, statusHistory) cuando el repositorio las carga.
 */
export class GetVacancyDetailUseCase {
  constructor(private readonly vacancyRepo: IVacancyRepository) {}

  async execute(input: GetVacancyDetailInput): Promise<GetVacancyDetailOutput> {
    try {
      const vacancy = await this.vacancyRepo.findById(
        input.id,
        input.tenantId
      );

      if (!vacancy) {
        return { success: false, error: "Vacante no encontrada" };
      }

      return { success: true, vacancy: vacancy.toJSON() };
    } catch (error) {
      console.error("Error in GetVacancyDetailUseCase:", error);
      return { success: false, error: "Error al obtener el detalle de la vacante" };
    }
  }
}
