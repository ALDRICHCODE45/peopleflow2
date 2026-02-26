import type { IVacancyChecklistRepository } from "../../domain/interfaces/IVacancyChecklistRepository";

export interface DeleteChecklistItemInput {
  id: string;
  tenantId: string;
}

export interface DeleteChecklistItemOutput {
  success: boolean;
  error?: string;
}

export class DeleteChecklistItemUseCase {
  constructor(private readonly checklistRepo: IVacancyChecklistRepository) {}

  async execute(
    input: DeleteChecklistItemInput
  ): Promise<DeleteChecklistItemOutput> {
    try {
      const { id, tenantId } = input;

      // Find item to verify it exists and belongs to the tenant
      const existing = await this.checklistRepo.findById(id, tenantId);
      if (!existing) {
        return { success: false, error: "Ítem de checklist no encontrado" };
      }

      await this.checklistRepo.delete(id, tenantId);

      return { success: true };
    } catch (error) {
      console.error("Error in DeleteChecklistItemUseCase:", error);
      return { success: false, error: "Error al eliminar el ítem de checklist" };
    }
  }
}
