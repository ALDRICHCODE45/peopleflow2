import type { IRecruiterAssignmentHistoryRepository } from "../../domain/interfaces/IRecruiterAssignmentHistoryRepository";
import type { RecruiterAssignmentHistoryDTO } from "@features/vacancy/frontend/types/vacancy.types";

export interface GetRecruiterAssignmentHistoryInput {
  vacancyId: string;
  tenantId: string;
}

export interface GetRecruiterAssignmentHistoryOutput {
  success: boolean;
  data?: RecruiterAssignmentHistoryDTO[];
  error?: string;
}

export class GetRecruiterAssignmentHistoryUseCase {
  constructor(
    private readonly assignmentRepo: IRecruiterAssignmentHistoryRepository,
  ) {}

  async execute(
    input: GetRecruiterAssignmentHistoryInput,
  ): Promise<GetRecruiterAssignmentHistoryOutput> {
    try {
      const records = await this.assignmentRepo.findByVacancyId(
        input.vacancyId,
        input.tenantId,
      );

      return { success: true, data: records };
    } catch (error) {
      console.error("Error in GetRecruiterAssignmentHistoryUseCase:", error);
      return {
        success: false,
        error: "Error al obtener el historial de asignaciones",
      };
    }
  }
}
