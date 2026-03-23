import type { IRecruiterAssignmentHistoryRepository } from "../../domain/interfaces/IRecruiterAssignmentHistoryRepository";
import type { ReassignmentReasonType, VacancyStatusType } from "@features/vacancy/frontend/types/vacancy.types";

export interface ReassignVacancyInput {
  vacancyId: string;
  tenantId: string;
  newRecruiterId: string;
  newRecruiterName: string;
  reason: ReassignmentReasonType;
  notes?: string | null;
  currentVacancyStatus: VacancyStatusType;
  targetDeliveryDate?: Date | null;
  wasOverdue: boolean;
  assignedById: string;
  assignedByName: string;
}

export interface ReassignVacancyOutput {
  success: boolean;
  error?: string;
}

export class ReassignVacancyUseCase {
  constructor(
    private readonly assignmentRepo: IRecruiterAssignmentHistoryRepository,
  ) {}

  async execute(input: ReassignVacancyInput): Promise<ReassignVacancyOutput> {
    try {
      await this.assignmentRepo.reassign({
        vacancyId: input.vacancyId,
        tenantId: input.tenantId,
        newRecruiterId: input.newRecruiterId,
        newRecruiterName: input.newRecruiterName,
        reason: input.reason,
        notes: input.notes ?? null,
        currentVacancyStatus: input.currentVacancyStatus,
        targetDeliveryDate: input.targetDeliveryDate ?? null,
        wasOverdue: input.wasOverdue,
        assignedById: input.assignedById,
        assignedByName: input.assignedByName,
      });

      return { success: true };
    } catch (error) {
      console.error("Error in ReassignVacancyUseCase:", error);
      return { success: false, error: "Error al reasignar la vacante" };
    }
  }
}
