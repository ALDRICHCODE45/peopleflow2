import type { VacancyCandidate } from "../../domain/entities/VacancyCandidate";
import type {
  IVacancyCandidateRepository,
  UpdateCandidateData,
} from "../../domain/interfaces/IVacancyCandidateRepository";

export type UpdateCandidateInput = {
  id: string;
  tenantId: string;
} & UpdateCandidateData;

export interface UpdateCandidateOutput {
  success: boolean;
  candidate?: VacancyCandidate;
  error?: string;
}

export class UpdateCandidateUseCase {
  constructor(private readonly candidateRepo: IVacancyCandidateRepository) {}

  async execute(input: UpdateCandidateInput): Promise<UpdateCandidateOutput> {
    try {
      const { id, tenantId, ...fields } = input;

      // 1. Find existing candidate
      const existing = await this.candidateRepo.findById(id, tenantId);
      if (!existing) {
        return { success: false, error: "Candidato no encontrado" };
      }

      // 2. Validate name fields if provided
      if (fields.firstName !== undefined && fields.firstName.trim().length === 0) {
        return { success: false, error: "El nombre del candidato no puede estar vacío" };
      }
      if (fields.lastName !== undefined && fields.lastName.trim().length === 0) {
        return { success: false, error: "El apellido del candidato no puede estar vacío" };
      }

      // 3. Build updateData with only defined fields
      const updateData: UpdateCandidateData = {};
      if (fields.firstName !== undefined) updateData.firstName = fields.firstName.trim();
      if (fields.lastName !== undefined) updateData.lastName = fields.lastName.trim();
      if (fields.email !== undefined) updateData.email = fields.email;
      if (fields.phone !== undefined) updateData.phone = fields.phone;
      if (fields.isCurrentlyEmployed !== undefined) updateData.isCurrentlyEmployed = fields.isCurrentlyEmployed;
      if (fields.currentCompany !== undefined) updateData.currentCompany = fields.currentCompany;
      if (fields.currentSalary !== undefined) updateData.currentSalary = fields.currentSalary;
      if (fields.salaryExpectation !== undefined) updateData.salaryExpectation = fields.salaryExpectation;
      if (fields.currentModality !== undefined) updateData.currentModality = fields.currentModality;
      if (fields.countryCode !== undefined) updateData.countryCode = fields.countryCode;
      if (fields.regionCode !== undefined) updateData.regionCode = fields.regionCode;
      if (fields.currentCommissions !== undefined) updateData.currentCommissions = fields.currentCommissions;
      if (fields.currentBenefits !== undefined) updateData.currentBenefits = fields.currentBenefits;
      if (fields.candidateLocation !== undefined) updateData.candidateLocation = fields.candidateLocation;
      if (fields.otherBenefits !== undefined) updateData.otherBenefits = fields.otherBenefits;
      if (fields.status !== undefined) updateData.status = fields.status;
      if (fields.isInTerna !== undefined) updateData.isInTerna = fields.isInTerna;
      if (fields.isFinalist !== undefined) updateData.isFinalist = fields.isFinalist;
      if (fields.finalSalary !== undefined) updateData.finalSalary = fields.finalSalary;

      // 4. Special case: marking CONTRATADO auto-descarts all other candidates
      if (fields.status === "CONTRATADO") {
        await this.candidateRepo.markAsContratado(id, existing.vacancyId, tenantId);
        // Remove status from updateData — already handled by markAsContratado
        delete updateData.status;
      }

      // 5. Update the rest of candidate fields (if any remain)
      const hasOtherFields = Object.keys(updateData).length > 0;
      const candidate = hasOtherFields
        ? await this.candidateRepo.update(id, tenantId, updateData)
        : await this.candidateRepo.findById(id, tenantId);

      if (!candidate) {
        return { success: false, error: "Error al actualizar el candidato" };
      }

      return { success: true, candidate };
    } catch (error) {
      console.error("Error in UpdateCandidateUseCase:", error);
      return { success: false, error: "Error al actualizar el candidato" };
    }
  }
}
