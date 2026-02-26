import type { VacancyDTO } from "@features/vacancy/frontend/types/vacancy.types";
import type { IVacancyRepository } from "../../domain/interfaces/IVacancyRepository";
import type { IVacancyCandidateRepository } from "../../domain/interfaces/IVacancyCandidateRepository";
import type { IVacancyStatusHistoryRepository } from "../../domain/interfaces/IVacancyStatusHistoryRepository";
import { VacancyWorkflowService } from "../../domain/services/VacancyWorkflowService";

export interface ValidateTernaInput {
  vacancyId: string;
  tenantId: string;
  /** IDs de candidatos seleccionados para la terna */
  candidateIds: string[];
  changedById: string;
}

export interface ValidateTernaOutput {
  success: boolean;
  vacancy?: VacancyDTO;
  error?: string;
}

export class ValidateTernaUseCase {
  constructor(
    private readonly vacancyRepo: IVacancyRepository,
    private readonly candidateRepo: IVacancyCandidateRepository,
    private readonly statusHistoryRepo: IVacancyStatusHistoryRepository
  ) {}

  async execute(input: ValidateTernaInput): Promise<ValidateTernaOutput> {
    try {
      const { vacancyId, tenantId, candidateIds, changedById } = input;

      // 1. Load vacancy
      const vacancy = await this.vacancyRepo.findById(vacancyId, tenantId);
      if (!vacancy) {
        return { success: false, error: "Vacante no encontrada" };
      }

      // 2. Validate status
      if (vacancy.status !== "HUNTING") {
        return {
          success: false,
          error:
            "La vacante debe estar en estado Hunting para validar la terna",
        };
      }

      // 3. Validate terna selection
      const ternaResult = VacancyWorkflowService.validateTerna(candidateIds);
      if (!ternaResult.valid) {
        return { success: false, error: ternaResult.error };
      }

      // 4. Clear previous terna (sequential — must complete before marking new ones)
      await this.candidateRepo.clearTerna(vacancyId, tenantId);

      // 5. Execute in parallel: mark new terna + update vacancy status + create history
      const [, updatedVacancy] = await Promise.all([
        this.candidateRepo.markAsInTerna(candidateIds, vacancyId, tenantId),
        this.vacancyRepo.update(vacancyId, tenantId, {
          status: "FOLLOW_UP",
          actualDeliveryDate: new Date(),
        }),
        this.statusHistoryRepo.create({
          vacancyId,
          previousStatus: "HUNTING",
          newStatus: "FOLLOW_UP",
          isRollback: false,
          changedById,
          tenantId,
        }),
      ]);

      if (!updatedVacancy) {
        return { success: false, error: "Error al actualizar la vacante" };
      }

      return { success: true, vacancy: updatedVacancy.toJSON() };
    } catch (error) {
      console.error("Error in ValidateTernaUseCase:", error);
      return { success: false, error: "Error al validar la terna" };
    }
  }
}
