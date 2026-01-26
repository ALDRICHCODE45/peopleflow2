import type { IInteractionRepository } from "../../domain/interfaces/IInteractionRepository";
import type { IContactRepository } from "../../domain/interfaces/IContactRepository";
import { Interaction } from "../../domain/entities/Interaction";
import { InteractionTypeVO, InteractionSubjectVO } from "../../domain/value-objects";
import type { InteractionType } from "../../../frontend/types";

export interface AddInteractionInput {
  contactId: string;
  tenantId: string;
  userId: string;
  type: InteractionType;
  subject: string;
  content?: string;
  date?: string; // ISO string
}

export interface AddInteractionOutput {
  success: boolean;
  interaction?: Interaction;
  error?: string;
}

export class AddInteractionUseCase {
  constructor(
    private readonly interactionRepository: IInteractionRepository,
    private readonly contactRepository: IContactRepository
  ) {}

  async execute(input: AddInteractionInput): Promise<AddInteractionOutput> {
    try {
      // Verificar que el contacto existe
      const contact = await this.contactRepository.findById(
        input.contactId,
        input.tenantId
      );

      if (!contact) {
        return {
          success: false,
          error: "Contacto no encontrado",
        };
      }

      // Validaciones encapsuladas en Value Objects
      const interactionType = InteractionTypeVO.create(input.type);
      const subject = InteractionSubjectVO.create(input.subject);

      const interaction = await this.interactionRepository.create({
        type: interactionType.getValue(),
        subject: subject.getValue(),
        content: input.content?.trim() || null,
        date: input.date ? new Date(input.date) : new Date(),
        contactId: input.contactId,
        createdById: input.userId,
        tenantId: input.tenantId,
      });

      return {
        success: true,
        interaction,
      };
    } catch (error) {
      console.error("Error in AddInteractionUseCase:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Error al agregar interacción",
      };
    }
  }
}
