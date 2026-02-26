import type {
  IVacancyCandidateRepository,
} from "../../domain/interfaces/IVacancyCandidateRepository";
import type { IVacancyChecklistRepository } from "../../domain/interfaces/IVacancyChecklistRepository";
import type {
  IVacancyCandidateMatchRepository,
  CandidateMatchData,
} from "../../domain/interfaces/IVacancyCandidateMatchRepository";

export interface SaveCandidateMatchInput {
  candidateId: string;
  checklistItemId: string;
  feedback: string | null;
  tenantId: string;
}

export interface SaveCandidateMatchOutput {
  success: boolean;
  match?: CandidateMatchData;
  error?: string;
}

export class SaveCandidateMatchUseCase {
  constructor(
    private readonly candidateRepo: IVacancyCandidateRepository,
    private readonly checklistRepo: IVacancyChecklistRepository,
    private readonly matchRepo: IVacancyCandidateMatchRepository
  ) {}

  async execute(
    input: SaveCandidateMatchInput
  ): Promise<SaveCandidateMatchOutput> {
    try {
      const { candidateId, checklistItemId, feedback, tenantId } = input;

      // 1. Validate candidate exists
      const candidate = await this.candidateRepo.findById(candidateId, tenantId);
      if (!candidate) {
        return { success: false, error: "Candidato no encontrado" };
      }

      // 2. Validate checklist item exists
      const checklistItem = await this.checklistRepo.findById(checklistItemId, tenantId);
      if (!checklistItem) {
        return { success: false, error: "Ítem de checklist no encontrado" };
      }

      // 3. Upsert match
      const match = await this.matchRepo.upsert({
        candidateId,
        checklistItemId,
        feedback,
        tenantId,
      });

      return { success: true, match };
    } catch (error) {
      console.error("Error in SaveCandidateMatchUseCase:", error);
      return { success: false, error: "Error al guardar el match del candidato" };
    }
  }
}
