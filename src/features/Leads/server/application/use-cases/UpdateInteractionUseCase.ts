import type { IInteractionRepository } from "../../domain/interfaces/IInteractionRepository";
import { Interaction } from "../../domain/entities/Interaction";
import type { InteractionType } from "../../../frontend/types";

export interface UpdateInteractionInput {
  interactionId: string;
  tenantId: string;
  data: {
    type?: InteractionType;
    subject?: string;
    content?: string | null;
    date?: string;
  };
}

export interface UpdateInteractionOutput {
  success: boolean;
  interaction?: Interaction;
  error?: string;
}

export class UpdateInteractionUseCase {
  constructor(
    private readonly interactionRepository: IInteractionRepository
  ) {}

  async execute(input: UpdateInteractionInput): Promise<UpdateInteractionOutput> {
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

      const interaction = await this.interactionRepository.update(
        input.interactionId,
        input.tenantId,
        {
          type: input.data.type,
          subject: input.data.subject,
          content: input.data.content,
          date: input.data.date ? new Date(input.data.date) : undefined,
        }
      );

      if (!interaction) {
        return {
          success: false,
          error: "Error al actualizar la interacción",
        };
      }

      return {
        success: true,
        interaction,
      };
    } catch (error) {
      console.error("Error in UpdateInteractionUseCase:", error);
      return {
        success: false,
        error: "Error al actualizar la interacción",
      };
    }
  }
}
