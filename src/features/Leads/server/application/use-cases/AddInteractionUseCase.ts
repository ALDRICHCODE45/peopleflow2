import type { IInteractionRepository } from "../../domain/interfaces/IInteractionRepository";
import type { IContactRepository } from "../../domain/interfaces/IContactRepository";
import { Interaction } from "../../domain/entities/Interaction";
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

      // Validaciones
      const subject = input.subject?.trim() || "";

      if (subject.length < 2) {
        return {
          success: false,
          error: "El asunto debe tener al menos 2 caracteres",
        };
      }

      if (subject.length > 200) {
        return {
          success: false,
          error: "El asunto no puede exceder 200 caracteres",
        };
      }

      // Validar tipo de interacción
      const validTypes: InteractionType[] = [
        "CALL",
        "EMAIL",
        "MEETING",
        "NOTE",
        "LINKEDIN",
        "WHATSAPP",
      ];

      if (!validTypes.includes(input.type)) {
        return {
          success: false,
          error: "Tipo de interacción no válido",
        };
      }

      const interaction = await this.interactionRepository.create({
        type: input.type,
        subject,
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
      return {
        success: false,
        error: "Error al agregar interacción",
      };
    }
  }
}
