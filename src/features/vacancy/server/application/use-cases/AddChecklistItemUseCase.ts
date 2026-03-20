import type { VacancyChecklistItem } from "../../domain/entities/VacancyChecklistItem";
import type { IVacancyRepository } from "../../domain/interfaces/IVacancyRepository";
import type { IVacancyChecklistRepository } from "../../domain/interfaces/IVacancyChecklistRepository";

export interface AddChecklistItemInput {
  vacancyId: string;
  tenantId: string;
  requirement: string;
  order?: number;
}

export interface AddChecklistItemOutput {
  success: boolean;
  item?: VacancyChecklistItem;
  error?: string;
}

export class AddChecklistItemUseCase {
  constructor(
    private readonly vacancyRepo: IVacancyRepository,
    private readonly checklistRepo: IVacancyChecklistRepository,
  ) {}

  async execute(input: AddChecklistItemInput): Promise<AddChecklistItemOutput> {
    try {
      const { vacancyId, tenantId, order } = input;
      const requirement = input.requirement?.trim() ?? "";

      // 1. Validate requirement
      if (requirement.length === 0) {
        return {
          success: false,
          error: "El requisito del checklist no puede estar vacío",
        };
      }
      if (requirement.length > 300) {
        return {
          success: false,
          error: "El requisito no puede exceder 300 caracteres",
        };
      }

      // 2. Validate vacancy exists
      const vacancy = await this.vacancyRepo.findById(vacancyId, tenantId);
      if (!vacancy) {
        return { success: false, error: "Vacante no encontrada" };
      }

      // 3. Calculate order if not provided
      let finalOrder = order;
      if (finalOrder === undefined) {
        const count = await this.checklistRepo.countByVacancyId(
          vacancyId,
          tenantId,
        );
        finalOrder = count + 1;
      }

      // 4. Create item
      const item = await this.checklistRepo.create({
        vacancyId,
        requirement,
        order: finalOrder,
        tenantId,
      });

      return { success: true, item };
    } catch (error) {
      console.error("Error in AddChecklistItemUseCase:", error);
      return { success: false, error: "Error al agregar el ítem de checklist" };
    }
  }
}
