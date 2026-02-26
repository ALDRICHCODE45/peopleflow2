import type { VacancyChecklistItem } from "../../domain/entities/VacancyChecklistItem";
import type {
  IVacancyChecklistRepository,
  UpdateChecklistItemData,
} from "../../domain/interfaces/IVacancyChecklistRepository";

export interface UpdateChecklistItemInput {
  id: string;
  tenantId: string;
  requirement?: string;
  isCompleted?: boolean;
  order?: number;
}

export interface UpdateChecklistItemOutput {
  success: boolean;
  item?: VacancyChecklistItem;
  error?: string;
}

export class UpdateChecklistItemUseCase {
  constructor(private readonly checklistRepo: IVacancyChecklistRepository) {}

  async execute(
    input: UpdateChecklistItemInput
  ): Promise<UpdateChecklistItemOutput> {
    try {
      const { id, tenantId } = input;

      // 1. Find existing item
      const existing = await this.checklistRepo.findById(id, tenantId);
      if (!existing) {
        return { success: false, error: "Ítem de checklist no encontrado" };
      }

      // 2. Validate requirement if provided
      if (input.requirement !== undefined) {
        const requirement = input.requirement.trim();
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
      }

      // 3. Build updateData with only defined fields
      const updateData: UpdateChecklistItemData = {};
      if (input.requirement !== undefined) updateData.requirement = input.requirement.trim();
      if (input.isCompleted !== undefined) updateData.isCompleted = input.isCompleted;
      if (input.order !== undefined) updateData.order = input.order;

      // 4. Update item
      const item = await this.checklistRepo.update(id, tenantId, updateData);
      if (!item) {
        return { success: false, error: "Error al actualizar el ítem de checklist" };
      }

      return { success: true, item };
    } catch (error) {
      console.error("Error in UpdateChecklistItemUseCase:", error);
      return { success: false, error: "Error al actualizar el ítem de checklist" };
    }
  }
}
