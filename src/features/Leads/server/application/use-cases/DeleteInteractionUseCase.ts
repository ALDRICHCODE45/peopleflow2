import type { IInteractionRepository } from "../../domain/interfaces/IInteractionRepository";

export interface DeleteInteractionInput {
  interactionId: string;
  tenantId: string;
}

export interface DeleteInteractionOutput {
  success: boolean;
  error?: string;
}

export class DeleteInteractionUseCase {
  constructor(
    private readonly interactionRepository: IInteractionRepository
  ) {}

  async execute(input: DeleteInteractionInput): Promise<DeleteInteractionOutput> {
    try {
      // Verify interaction exists
      const existingInteraction = await this.interactionRepository.findById(
        input.interactionId,
        input.tenantId
      );

      if (!existingInteraction) {
        return {
          success: false,
          error: "Interacción no encontrada",
        };
      }

      const deleted = await this.interactionRepository.delete(
        input.interactionId,
        input.tenantId
      );

      if (!deleted) {
        return {
          success: false,
          error: "Error al eliminar la interacción",
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error in DeleteInteractionUseCase:", error);
      return {
        success: false,
        error: "Error al eliminar la interacción",
      };
    }
  }
}
