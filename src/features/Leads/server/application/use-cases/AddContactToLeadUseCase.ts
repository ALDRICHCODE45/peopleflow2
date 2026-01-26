import type { IContactRepository } from "../../domain/interfaces/IContactRepository";
import type { ILeadRepository } from "../../domain/interfaces/ILeadRepository";
import { Contact } from "../../domain/entities/Contact";
import { PersonNameVO, EmailVO, URLVO } from "../../domain/value-objects";

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

      // Validaciones encapsuladas en Value Objects
      const personName = PersonNameVO.create(input.firstName, input.lastName);
      const email = EmailVO.create(input.email);
      const linkedInUrl = URLVO.create(input.linkedInUrl);

      const contact = await this.contactRepository.create({
        firstName: personName.getFirstName(),
        lastName: personName.getLastName(),
        email: email.getValue(),
        phone: input.phone?.trim() || null,
        position: input.position?.trim() || null,
        linkedInUrl: linkedInUrl.getValue(),
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
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Error al agregar contacto",
      };
    }
  }
}
