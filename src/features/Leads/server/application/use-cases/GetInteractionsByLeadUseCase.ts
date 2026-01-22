import type { IInteractionRepository } from "../../domain/interfaces/IInteractionRepository";
import { Interaction } from "../../domain/entities/Interaction";

export interface GetInteractionsByLeadInput {
  leadId: string;
  tenantId: string;
}

export interface GetInteractionsByLeadOutput {
  success: boolean;
  interactions?: Interaction[];
  error?: string;
}

export class GetInteractionsByLeadUseCase {
  constructor(private readonly interactionRepository: IInteractionRepository) {}

  async execute(input: GetInteractionsByLeadInput): Promise<GetInteractionsByLeadOutput> {
    try {
      const interactions = await this.interactionRepository.findByLeadId(
        input.leadId,
        input.tenantId
      );

      return {
        success: true,
        interactions,
      };
    } catch (error) {
      console.error("Error in GetInteractionsByLeadUseCase:", error);
      return {
        success: false,
        error: "Error al obtener interacciones",
      };
    }
  }
}
