import type {
  IContactRepository,
  UpdateContactData,
} from "../../domain/interfaces/IContactRepository";
import { Contact } from "../../domain/entities/Contact";
import { PersonNameVO, EmailVO, URLVO } from "../../domain/value-objects";
import { LeadStatus } from "@/features/Leads/frontend/types";

export interface UpdateContactInput {
  contactId: string;
  tenantId: string;
  data: {
    firstName?: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    position?: string | null;
    linkedInUrl?: string | null;
    isPrimary?: boolean;
    notes?: string | null;
    tag?: LeadStatus | null;
  };
}

export interface UpdateContactOutput {
  success: boolean;
  contact?: Contact;
  error?: string;
}

export class UpdateContactUseCase {
  constructor(private readonly contactRepository: IContactRepository) {}

  async execute(input: UpdateContactInput): Promise<UpdateContactOutput> {
    try {
      // Verificar que el contacto existe
      const existingContact = await this.contactRepository.findById(
        input.contactId,
        input.tenantId,
      );

      if (!existingContact) {
        return {
          success: false,
          error: "Contacto no encontrado",
        };
      }

      const updateData: UpdateContactData = {};

      // Validar nombre usando PersonNameVO.createPartial si se actualiza firstName o lastName
      if (
        input.data.firstName !== undefined ||
        input.data.lastName !== undefined
      ) {
        const personName = PersonNameVO.createPartial(
          input.data.firstName,
          input.data.lastName,
          {
            firstName: existingContact.firstName,
            lastName: existingContact.lastName,
          },
        );

        if (input.data.firstName !== undefined) {
          updateData.firstName = personName.getFirstName();
        }
        if (input.data.lastName !== undefined) {
          updateData.lastName = personName.getLastName();
        }
      }

      // Validar email si se proporciona
      if (input.data.email !== undefined) {
        const email = EmailVO.create(input.data.email);
        updateData.email = email.getValue();
      }

      if (input.data.phone !== undefined) {
        updateData.phone = input.data.phone?.trim() || null;
      }
      if (input.data.position !== undefined) {
        updateData.position = input.data.position?.trim() || null;
      }

      // Validar linkedInUrl si se proporciona
      if (input.data.linkedInUrl !== undefined) {
        const linkedInUrl = URLVO.create(input.data.linkedInUrl);
        updateData.linkedInUrl = linkedInUrl.getValue();
      }

      if (input.data.isPrimary !== undefined) {
        updateData.isPrimary = input.data.isPrimary;
      }
      if (input.data.notes !== undefined) {
        updateData.notes = input.data.notes?.trim() || null;
      }

      if (input.data.tag !== undefined) {
        updateData.tag = input.data.tag;
      }

      const contact = await this.contactRepository.update(
        input.contactId,
        input.tenantId,
        updateData,
      );

      if (!contact) {
        return {
          success: false,
          error: "Error al actualizar contacto",
        };
      }

      return {
        success: true,
        contact,
      };
    } catch (error) {
      console.error("Error in UpdateContactUseCase:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Error al actualizar contacto",
      };
    }
  }
}
