import type { IContactRepository } from "../../domain/interfaces/IContactRepository";
import type { ILeadRepository } from "../../domain/interfaces/ILeadRepository";
import { Contact } from "../../domain/entities/Contact";

export interface AddContactToLeadInput {
  leadId: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  position?: string;
  linkedInUrl?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface AddContactToLeadOutput {
  success: boolean;
  contact?: Contact;
  error?: string;
}

export class AddContactToLeadUseCase {
  constructor(
    private readonly contactRepository: IContactRepository,
    private readonly leadRepository: ILeadRepository
  ) {}

  async execute(input: AddContactToLeadInput): Promise<AddContactToLeadOutput> {
    try {
      // Verificar que el lead existe
      const lead = await this.leadRepository.findById(
        input.leadId,
        input.tenantId
      );

      if (!lead) {
        return {
          success: false,
          error: "Lead no encontrado",
        };
      }

      if (!lead.canEdit()) {
        return {
          success: false,
          error: "El lead no puede ser editado",
        };
      }

      // Validaciones
      const firstName = input.firstName?.trim() || "";
      const lastName = input.lastName?.trim() || "";

      if (firstName.length < 2) {
        return {
          success: false,
          error: "El nombre debe tener al menos 2 caracteres",
        };
      }

      if (lastName.length < 2) {
        return {
          success: false,
          error: "El apellido debe tener al menos 2 caracteres",
        };
      }

      if (firstName.length > 100) {
        return {
          success: false,
          error: "El nombre no puede exceder 100 caracteres",
        };
      }

      if (lastName.length > 100) {
        return {
          success: false,
          error: "El apellido no puede exceder 100 caracteres",
        };
      }

      // Validar email si se proporciona
      if (input.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.email)) {
          return {
            success: false,
            error: "El email no tiene un formato válido",
          };
        }
      }

      const contact = await this.contactRepository.create({
        firstName,
        lastName,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        position: input.position?.trim() || null,
        linkedInUrl: input.linkedInUrl?.trim() || null,
        isPrimary: input.isPrimary,
        notes: input.notes?.trim() || null,
        leadId: input.leadId,
        tenantId: input.tenantId,
      });

      return {
        success: true,
        contact,
      };
    } catch (error) {
      console.error("Error in AddContactToLeadUseCase:", error);
      return {
        success: false,
        error: "Error al agregar contacto",
      };
    }
  }
}
