import type { IVacancyCandidateRepository } from "../../domain/interfaces/IVacancyCandidateRepository";

export interface RemoveCandidateInput {
  id: string;
  vacancyId: string;
  tenantId: string;
}

export interface RemoveCandidateOutput {
  success: boolean;
  error?: string;
}

export class RemoveCandidateUseCase {
  constructor(private readonly candidateRepo: IVacancyCandidateRepository) {}

  async execute(input: RemoveCandidateInput): Promise<RemoveCandidateOutput> {
    try {
      const { id, tenantId } = input;

      // 1. Find candidate
      const candidate = await this.candidateRepo.findById(id, tenantId);
      if (!candidate) {
        return { success: false, error: "Candidato no encontrado" };
      }

      // 2. Prevent deleting finalist
      if (candidate.isFinalist === true) {
        return {
          success: false,
          error:
            "No se puede eliminar al candidato finalista. Primero seleccione otro finalista.",
        };
      }

      // 3. Delete candidate
      await this.candidateRepo.delete(id, tenantId);

      return { success: true };
    } catch (error) {
      console.error("Error in RemoveCandidateUseCase:", error);
      return { success: false, error: "Error al eliminar el candidato" };
    }
  }
}
