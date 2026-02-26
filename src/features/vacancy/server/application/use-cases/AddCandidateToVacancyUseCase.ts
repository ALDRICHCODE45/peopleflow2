import type { VacancyCandidate } from "../../domain/entities/VacancyCandidate";
import type { IVacancyRepository } from "../../domain/interfaces/IVacancyRepository";
import type {
  IVacancyCandidateRepository,
  CreateCandidateData,
} from "../../domain/interfaces/IVacancyCandidateRepository";

/** All candidate fields except vacancyId and tenantId (injected internally) */
export type AddCandidateInput = {
  vacancyId: string;
  tenantId: string;
} & Omit<CreateCandidateData, "vacancyId" | "tenantId">;

export interface AddCandidateToVacancyOutput {
  success: boolean;
  candidate?: VacancyCandidate;
  error?: string;
}

/** Terminal statuses that prevent adding new candidates */
const TERMINAL_STATUSES = ["PLACEMENT", "CANCELADA", "PERDIDA"] as const;

export class AddCandidateToVacancyUseCase {
  constructor(
    private readonly vacancyRepo: IVacancyRepository,
    private readonly candidateRepo: IVacancyCandidateRepository
  ) {}

  async execute(input: AddCandidateInput): Promise<AddCandidateToVacancyOutput> {
    try {
      const { vacancyId, tenantId, firstName, lastName, ...rest } = input;

      // 1. Load vacancy
      const vacancy = await this.vacancyRepo.findById(vacancyId, tenantId);
      if (!vacancy) {
        return { success: false, error: "Vacante no encontrada" };
      }

      // 2. Check terminal status
      if ((TERMINAL_STATUSES as readonly string[]).includes(vacancy.status)) {
        return {
          success: false,
          error: "No se pueden agregar candidatos a una vacante finalizada",
        };
      }

      // 3. Validate firstName and lastName
      if (!firstName || firstName.trim().length === 0) {
        return { success: false, error: "El nombre del candidato es requerido" };
      }
      if (!lastName || lastName.trim().length === 0) {
        return { success: false, error: "El apellido del candidato es requerido" };
      }

      // 4. Create candidate
      const candidate = await this.candidateRepo.create({
        ...rest,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        vacancyId,
        tenantId,
      });

      return { success: true, candidate };
    } catch (error) {
      console.error("Error in AddCandidateToVacancyUseCase:", error);
      return { success: false, error: "Error al agregar el candidato" };
    }
  }
}
