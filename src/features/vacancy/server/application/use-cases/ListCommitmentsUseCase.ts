import type {
  IVacancyCommitmentRepository,
} from "../../domain/interfaces/IVacancyCommitmentRepository";
import type { VacancyCommitmentDTO } from "@features/vacancy/frontend/types/vacancy.types";

interface ListCommitmentsInput {
  vacancyId: string;
  tenantId: string;
}

interface ListCommitmentsOutput {
  success: boolean;
  commitments?: VacancyCommitmentDTO[];
  error?: string;
}

export class ListCommitmentsUseCase {
  constructor(
    private readonly repository: IVacancyCommitmentRepository
  ) {}

  async execute(
    input: ListCommitmentsInput
  ): Promise<ListCommitmentsOutput> {
    try {
      const commitments = await this.repository.findByVacancyId(
        input.vacancyId,
        input.tenantId
      );

      return {
        success: true,
        commitments: commitments.map((c) => c.toJSON()),
      };
    } catch (error) {
      console.error("Error in ListCommitmentsUseCase:", error);
      return {
        success: false,
        error: "Error al listar compromisos",
      };
    }
  }
}
