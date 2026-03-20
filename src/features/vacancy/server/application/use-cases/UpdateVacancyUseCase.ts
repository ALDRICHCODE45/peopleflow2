import type {
  VacancyModality,
  VacancyServiceType,
} from "@features/vacancy/frontend/types/vacancy.types";
import type { Vacancy } from "../../domain/entities/Vacancy";
import type {
  IVacancyRepository,
  UpdateVacancyData,
} from "../../domain/interfaces/IVacancyRepository";
import { SalaryRangeVO } from "../../domain/value-objects/SalaryRange";

export interface UpdateVacancyInput {
  id: string;
  tenantId: string;
  position?: string;
  salaryType?: "FIXED" | "RANGE";
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
  entryDate?: Date | null;
  salaryFixed?: number | null;
  serviceType?: VacancyServiceType;
  assignedAt?: Date | null;
}

export interface UpdateVacancyOutput {
  success: boolean;
  vacancy?: Vacancy;
  error?: string;
}

export class UpdateVacancyUseCase {
  constructor(private readonly vacancyRepo: IVacancyRepository) {}

  async execute(input: UpdateVacancyInput): Promise<UpdateVacancyOutput> {
    try {
      // 1. Find existing vacancy
      const existing = await this.vacancyRepo.findById(
        input.id,
        input.tenantId
      );
      if (!existing) {
        return { success: false, error: "Vacante no encontrada" };
      }

      // 2. Check if vacancy can be edited
      if (!existing.canEdit()) {
        return {
          success: false,
          error: "Esta vacante no puede ser editada",
        };
      }

      // 3. Validate position if provided
      if (input.position !== undefined) {
        const position = input.position.trim();
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
      }

      // 4. Validate salary fields if provided
      const hasSalaryFields =
        input.salaryType !== undefined ||
        input.salaryMin !== undefined ||
        input.salaryMax !== undefined ||
        input.salaryFixed !== undefined;

      if (hasSalaryFields) {
        const effectiveSalaryType = input.salaryType ?? existing.salaryType;
        try {
          SalaryRangeVO.create({
            salaryType: effectiveSalaryType,
            min: effectiveSalaryType === "FIXED" ? undefined : (input.salaryMin !== undefined ? input.salaryMin : existing.salaryMin),
            max: effectiveSalaryType === "FIXED" ? undefined : (input.salaryMax !== undefined ? input.salaryMax : existing.salaryMax),
            fixed: effectiveSalaryType === "FIXED" ? (input.salaryFixed !== undefined ? input.salaryFixed : existing.salaryFixed) : undefined,
          });
        } catch (e) {
          return {
            success: false,
            error: e instanceof Error ? e.message : "Rango salarial inválido",
          };
        }
      }

      // 5. Build updateData with only defined fields
      const updateData: UpdateVacancyData = {};
      if (input.position !== undefined) updateData.position = input.position.trim();
      if (input.salaryType !== undefined) updateData.salaryType = input.salaryType;
      if (input.salaryMin !== undefined) updateData.salaryMin = input.salaryMin;
      if (input.salaryMax !== undefined) updateData.salaryMax = input.salaryMax;
      if (input.salaryFixed !== undefined) updateData.salaryFixed = input.salaryFixed;
      if (input.commissions !== undefined) updateData.commissions = input.commissions;
      if (input.benefits !== undefined) updateData.benefits = input.benefits;
      if (input.tools !== undefined) updateData.tools = input.tools;
      if (input.modality !== undefined) updateData.modality = input.modality;
      if (input.schedule !== undefined) updateData.schedule = input.schedule;
      if (input.countryCode !== undefined) updateData.countryCode = input.countryCode;
      if (input.regionCode !== undefined) updateData.regionCode = input.regionCode;
      if (input.requiresPsychometry !== undefined) updateData.requiresPsychometry = input.requiresPsychometry;
      if (input.targetDeliveryDate !== undefined) updateData.targetDeliveryDate = input.targetDeliveryDate;
      if (input.entryDate !== undefined) updateData.entryDate = input.entryDate;
      if (input.serviceType !== undefined) updateData.serviceType = input.serviceType;
      if (input.assignedAt !== undefined) updateData.assignedAt = input.assignedAt ?? undefined;

      // 6. Update vacancy
      const vacancy = await this.vacancyRepo.update(
        input.id,
        input.tenantId,
        updateData
      );

      if (!vacancy) {
        return { success: false, error: "Error al actualizar la vacante" };
      }

      return { success: true, vacancy };
    } catch (error) {
      console.error("Error in UpdateVacancyUseCase:", error);
      return { success: false, error: "Error al actualizar la vacante" };
    }
  }
}
