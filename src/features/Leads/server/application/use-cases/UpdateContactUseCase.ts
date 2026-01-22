import type { IContactRepository, UpdateContactData } from "../../domain/interfaces/IContactRepository";
import { Contact } from "../../domain/entities/Contact";

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
        input.tenantId
      );

      if (!existingContact) {
        return {
          success: false,
          error: "Contacto no encontrado",
        };
      }

      // Validaciones
      if (input.data.firstName !== undefined) {
        const firstName = input.data.firstName.trim();
        if (firstName.length < 2) {
          return {
            success: false,
            error: "El nombre debe tener al menos 2 caracteres",
          };
        }
        if (firstName.length > 100) {
          return {
            success: false,
            error: "El nombre no puede exceder 100 caracteres",
          };
        }
      }

      if (input.data.lastName !== undefined) {
        const lastName = input.data.lastName.trim();
        if (lastName.length < 2) {
          return {
            success: false,
            error: "El apellido debe tener al menos 2 caracteres",
          };
        }
        if (lastName.length > 100) {
          return {
            success: false,
            error: "El apellido no puede exceder 100 caracteres",
          };
        }
      }

      // Validar email si se proporciona
      if (input.data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.data.email)) {
          return {
            success: false,
            error: "El email no tiene un formato válido",
          };
        }
      }

      const updateData: UpdateContactData = {};

      if (input.data.firstName !== undefined) {
        updateData.firstName = input.data.firstName.trim();
      }
      if (input.data.lastName !== undefined) {
        updateData.lastName = input.data.lastName.trim();
      }
      if (input.data.email !== undefined) {
        updateData.email = input.data.email?.trim() || null;
      }
      if (input.data.phone !== undefined) {
        updateData.phone = input.data.phone?.trim() || null;
      }
      if (input.data.position !== undefined) {
        updateData.position = input.data.position?.trim() || null;
      }
      if (input.data.linkedInUrl !== undefined) {
        updateData.linkedInUrl = input.data.linkedInUrl?.trim() || null;
      }
      if (input.data.isPrimary !== undefined) {
        updateData.isPrimary = input.data.isPrimary;
      }
      if (input.data.notes !== undefined) {
        updateData.notes = input.data.notes?.trim() || null;
      }

      const contact = await this.contactRepository.update(
        input.contactId,
        input.tenantId,
        updateData
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
      return {
        success: false,
        error: "Error al actualizar contacto",
      };
    }
  }
}
