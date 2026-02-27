import type { VacancyDTO } from "@features/vacancy/frontend/types/vacancy.types";
import type { IVacancyRepository } from "../../domain/interfaces/IVacancyRepository";
import type { IVacancyCandidateRepository } from "../../domain/interfaces/IVacancyCandidateRepository";
import type { IVacancyStatusHistoryRepository } from "../../domain/interfaces/IVacancyStatusHistoryRepository";
import { VacancyWorkflowService } from "../../domain/services/VacancyWorkflowService";

export interface SelectFinalistInput {
  candidateId: string;
  vacancyId: string;
  tenantId: string;
  salaryFixed: number;
  entryDate: Date;
  changedById: string;
}

export interface SelectFinalistOutput {
  success: boolean;
  vacancy?: VacancyDTO;
  error?: string;
}

export class SelectFinalistUseCase {
  constructor(
    private readonly vacancyRepo: IVacancyRepository,
    private readonly candidateRepo: IVacancyCandidateRepository,
    private readonly statusHistoryRepo: IVacancyStatusHistoryRepository
  ) {}

  async execute(input: SelectFinalistInput): Promise<SelectFinalistOutput> {
    try {
      const { candidateId, vacancyId, tenantId, salaryFixed, entryDate, changedById } =
        input;

      // 1. Load vacancy
      const vacancy = await this.vacancyRepo.findById(vacancyId, tenantId);
      if (!vacancy) {
        return { success: false, error: "Vacante no encontrada" };
      }

      // 2. Validate status
      if (vacancy.status !== "FOLLOW_UP") {
        return {
          success: false,
          error: "Debe estar en Follow Up para seleccionar finalista",
        };
      }

      // 3. Validate pre-placement requirements
      const prePlacementResult = VacancyWorkflowService.validatePrePlacement(
        salaryFixed,
        entryDate,
        true
      );
      if (!prePlacementResult.valid) {
        return { success: false, error: prePlacementResult.error };
      }

      // 4. Load and validate candidate
      const candidate = await this.candidateRepo.findById(candidateId, tenantId);
      if (!candidate || candidate.vacancyId !== vacancyId) {
        return {
          success: false,
          error: "Candidato no encontrado en esta vacante",
        };
      }

      // 5. Validate candidate is in terna
      if (candidate.isInTerna !== true) {
        return {
          success: false,
          error: "El candidato debe haber sido parte de la terna",
        };
      }

      // 6. Execute in parallel: mark finalist + update vacancy status + create history
      const [, updatedVacancy] = await Promise.all([
        this.candidateRepo.update(candidateId, tenantId, {
          isFinalist: true,
          status: "EN_TERNA",
        }),
        this.vacancyRepo.update(vacancyId, tenantId, {
          status: "PRE_PLACEMENT",
          salaryFixed,
          entryDate,
        }),
        this.statusHistoryRepo.create({
          vacancyId,
          previousStatus: "FOLLOW_UP",
          newStatus: "PRE_PLACEMENT",
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
      console.error("Error in SelectFinalistUseCase:", error);
      return { success: false, error: "Error al seleccionar el finalista" };
    }
  }
}
