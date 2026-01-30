import type { IInteractionRepository } from "../../domain/interfaces/IInteractionRepository";
import { Interaction } from "../../domain/entities/Interaction";

export interface GetInteractionsByContactInput {
  contactId: string;
  tenantId: string;
}

export interface GetInteractionsByContactOutput {
  success: boolean;
  interactions?: Interaction[];
  error?: string;
}

export class GetInteractionsByContactUseCase {
  constructor(private readonly interactionRepository: IInteractionRepository) {}

  async execute(
    input: GetInteractionsByContactInput
  ): Promise<GetInteractionsByContactOutput> {
    try {
      const interactions = await this.interactionRepository.findByContactId(
        input.contactId,
        input.tenantId
      );

      return {
        success: true,
        interactions,
      };
    } catch (error) {
      console.error("Error in GetInteractionsByContactUseCase:", error);
      return {
        success: false,
        error: "Error al obtener interacciones del contacto",
      };
    }
  }
}
