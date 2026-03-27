import type { VacancyDTO } from "@features/vacancy/frontend/types/vacancy.types";
import type { IVacancyRepository } from "../../domain/interfaces/IVacancyRepository";
import type { IVacancyStatusHistoryRepository } from "../../domain/interfaces/IVacancyStatusHistoryRepository";

export interface ConfirmPlacementInput {
  vacancyId: string;
  tenantId: string;
  changedById: string;
  congratsEmailSent?: boolean;
  hiredCandidateId?: string; // ID del candidato que se está contratando
}

export interface ConfirmPlacementOutput {
  success: boolean;
  vacancy?: VacancyDTO;
  error?: string;
}

export class ConfirmPlacementUseCase {
  constructor(
    private readonly vacancyRepo: IVacancyRepository,
    private readonly statusHistoryRepo: IVacancyStatusHistoryRepository
  ) {}

  async execute(input: ConfirmPlacementInput): Promise<ConfirmPlacementOutput> {
    try {
      const { vacancyId, tenantId, changedById } = input;

      // 1. Load vacancy
      const vacancy = await this.vacancyRepo.findById(vacancyId, tenantId);
      if (!vacancy) {
        return { success: false, error: "Vacante no encontrada" };
      }

      // 2. Validate status
      if (vacancy.status !== "PRE_PLACEMENT") {
        return {
          success: false,
          error:
            "La vacante debe estar en Pre-Placement para confirmar el ingreso",
        };
      }

      // 3. Calculate commission date: 15th of the NEXT month
      const today = new Date();
      const commissionDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);

      // 4. Update vacancy + create history in parallel
      const [updatedVacancy] = await Promise.all([
        this.vacancyRepo.update(vacancyId, tenantId, {
          status: "PLACEMENT",
          placementConfirmedAt: new Date(),
          commissionDate,
          congratsEmailSent: input.congratsEmailSent ?? false,
          hiredCandidateId: input.hiredCandidateId ?? null, // FK al candidato contratado
        }),
        this.statusHistoryRepo.create({
          vacancyId,
          previousStatus: "PRE_PLACEMENT",
          newStatus: "PLACEMENT",
          isRollback: false,
          changedById,
          tenantId,
        }),
      ]);

      if (!updatedVacancy) {
        return { success: false, error: "Error al confirmar el placement" };
      }

      return { success: true, vacancy: updatedVacancy.toJSON() };
    } catch (error) {
      console.error("Error in ConfirmPlacementUseCase:", error);
      return { success: false, error: "Error al confirmar el ingreso" };
    }
  }
}
