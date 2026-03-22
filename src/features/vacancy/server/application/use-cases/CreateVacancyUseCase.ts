import type {
  VacancyModality,
  VacancyServiceType,
  VacancyCurrency,
} from "@features/vacancy/frontend/types/vacancy.types";
import type { Vacancy } from "../../domain/entities/Vacancy";
import type { IVacancyRepository } from "../../domain/interfaces/IVacancyRepository";
import { SalaryRangeVO } from "../../domain/value-objects/SalaryRange";
import { VacancySaleTypeService } from "../../domain/services/VacancySaleTypeService";

export interface CreateVacancyInput {
  position: string;
  recruiterId: string;
  clientId: string;
  currency?: VacancyCurrency | null;
  salaryType?: "FIXED" | "RANGE";
  salaryFixed?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  commissions?: string | null;
  benefits?: string | null;
  tools?: string | null;
  modality?: VacancyModality | null;
  schedule?: string | null;
  countryCode?: string | null;
  regionCode?: string | null;
  requiresPsychometry?: boolean;
  targetDeliveryDate?: Date | null;
  serviceType: VacancyServiceType;
  assignedAt?: Date;
  tenantId: string;
  createdById?: string | null;
}

export interface CreateVacancyOutput {
  success: boolean;
  vacancy?: Vacancy;
  error?: string;
}

export class CreateVacancyUseCase {
  constructor(private readonly vacancyRepo: IVacancyRepository) {}

  async execute(input: CreateVacancyInput): Promise<CreateVacancyOutput> {
    try {
      // 1. Validate position
      const position = input.position?.trim() ?? "";
      if (position.length < 2) {
        return {
          success: false,
          error: "El nombre del puesto debe tener al menos 2 caracteres",
        };
      }
      if (position.length > 200) {
        return {
          success: false,
          error: "El nombre del puesto no puede exceder 200 caracteres",
        };
      }

      // 2. Validate salary range via VO
      try {
        SalaryRangeVO.create({
          salaryType: input.salaryType,
          min: input.salaryType === "FIXED" ? undefined : input.salaryMin,
          max: input.salaryType === "FIXED" ? undefined : input.salaryMax,
          fixed: input.salaryType === "FIXED" ? input.salaryFixed : undefined,
        });
      } catch (e) {
        return {
          success: false,
          error: e instanceof Error ? e.message : "Rango salarial inválido",
        };
      }

      // 3. Determine sale type based on existing vacancies for this client
      const existingVacancies = await this.vacancyRepo.findByClientId(
        input.clientId,
        input.tenantId
      );
      const saleType = VacancySaleTypeService.determine(existingVacancies.length);

      // 4. Create vacancy
      const vacancy = await this.vacancyRepo.create({
        position,
        recruiterId: input.recruiterId,
        clientId: input.clientId,
        saleType,
        currency: input.currency ?? null,
        salaryType: input.salaryType ?? "RANGE",
        salaryMin: input.salaryType === "FIXED" ? null : (input.salaryMin ?? null),
        salaryMax: input.salaryType === "FIXED" ? null : (input.salaryMax ?? null),
        salaryFixed: input.salaryType === "FIXED" ? (input.salaryFixed ?? null) : null,
        commissions: input.commissions ?? null,
        benefits: input.benefits ?? null,
        tools: input.tools ?? null,
        modality: input.modality ?? null,
        schedule: input.schedule ?? null,
        countryCode: input.countryCode ?? null,
        regionCode: input.regionCode ?? null,
        requiresPsychometry: input.requiresPsychometry ?? false,
        targetDeliveryDate: input.targetDeliveryDate ?? null,
        serviceType: input.serviceType,
        assignedAt: input.assignedAt ?? undefined,
        tenantId: input.tenantId,
        createdById: input.createdById ?? null,
      });

      return { success: true, vacancy };
    } catch (error) {
      console.error("Error in CreateVacancyUseCase:", error);
      return { success: false, error: "Error al crear la vacante" };
    }
  }
}
