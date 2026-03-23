import type { VacancyDTO } from "@features/vacancy/frontend/types/vacancy.types";
import type {
  IVacancyRepository,
  CreateWarrantyVacancyData,
} from "../../domain/interfaces/IVacancyRepository";
import type { CreateWarrantyVacancyInput } from "@features/vacancy/frontend/types/vacancy.types";
import { VacancySaleTypeService } from "../../domain/services/VacancySaleTypeService";

export interface CreateWarrantyVacancyUseCaseInput
  extends CreateWarrantyVacancyInput {
  tenantId: string;
  userId: string;
  recruiterName?: string | null;
  createdByName?: string | null;
}

export interface CreateWarrantyVacancyOutput {
  success: boolean;
  vacancy?: VacancyDTO;
  error?: string;
}

export class CreateWarrantyVacancyUseCase {
  constructor(private readonly vacancyRepo: IVacancyRepository) {}

  async execute(
    input: CreateWarrantyVacancyUseCaseInput,
  ): Promise<CreateWarrantyVacancyOutput> {
    try {
      // 1. Verify original vacancy exists and is in PLACEMENT
      const original = await this.vacancyRepo.findById(
        input.originVacancyId,
        input.tenantId,
      );

      if (!original) {
        return { success: false, error: "Vacante original no encontrada" };
      }

      if (!original.canApplyWarranty()) {
        return {
          success: false,
          error: "Solo vacantes en PLACEMENT pueden aplicar garantía",
        };
      }

      // 2. Verify no warranty already exists
      const existingWarranty = await this.vacancyRepo.findByOriginVacancyId(
        input.originVacancyId,
        input.tenantId,
      );

      if (existingWarranty) {
        return {
          success: false,
          error: "Esta vacante ya tiene una garantía aplicada",
        };
      }

      // 3. Determine sale type (warranties count as existing client vacancies)
      const existingVacancies = await this.vacancyRepo.findByClientId(
        original.clientId,
        input.tenantId,
      );
      const saleType = VacancySaleTypeService.determine(
        existingVacancies.length,
      );

      // 4. Build warranty vacancy data
      const warrantyData: CreateWarrantyVacancyData = {
        originVacancyId: input.originVacancyId,
        position: input.position,
        recruiterId: input.recruiterId,
        recruiterName: input.recruiterName ?? null,
        clientId: original.clientId,
        saleType,
        serviceType: input.serviceType ?? original.serviceType,
        currency: input.currency ?? original.currency,
        salaryType: input.salaryType ?? original.salaryType ?? "RANGE",
        salaryMin: input.salaryMin ?? original.salaryMin,
        salaryMax: input.salaryMax ?? original.salaryMax,
        salaryFixed: input.salaryFixed ?? original.salaryFixed,
        commissions: input.commissions ?? original.commissions,
        benefits: input.benefits ?? original.benefits,
        tools: input.tools ?? original.tools,
        modality: input.modality ?? original.modality,
        schedule: input.schedule ?? original.schedule,
        countryCode: input.countryCode ?? original.countryCode,
        regionCode: input.regionCode ?? original.regionCode,
        requiresPsychometry:
          input.requiresPsychometry ?? original.requiresPsychometry,
        targetDeliveryDate: input.targetDeliveryDate
          ? new Date(input.targetDeliveryDate)
          : null,
        tenantId: input.tenantId,
        createdById: input.userId,
        createdByName: input.createdByName ?? null,
      };

      // 5. Create the warranty vacancy (with checklist + attachments duplication)
      const warranty =
        await this.vacancyRepo.createWarrantyVacancy(warrantyData);

      return { success: true, vacancy: warranty.toJSON() };
    } catch (error) {
      console.error("Error in CreateWarrantyVacancyUseCase:", error);
      return {
        success: false,
        error: "Error al crear la vacante de garantía",
      };
    }
  }
}
