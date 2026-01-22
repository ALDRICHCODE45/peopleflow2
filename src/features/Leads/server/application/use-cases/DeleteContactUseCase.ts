import type { IContactRepository } from "../../domain/interfaces/IContactRepository";

export interface DeleteContactInput {
  contactId: string;
  tenantId: string;
}

export interface DeleteContactOutput {
  success: boolean;
  error?: string;
}

export class DeleteContactUseCase {
  constructor(private readonly contactRepository: IContactRepository) {}

  async execute(input: DeleteContactInput): Promise<DeleteContactOutput> {
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

      const deleted = await this.contactRepository.delete(
        input.contactId,
        input.tenantId
      );

      if (!deleted) {
        return {
          success: false,
          error: "Error al eliminar contacto",
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error in DeleteContactUseCase:", error);
      return {
        success: false,
        error: "Error al eliminar contacto",
      };
    }
  }
}
