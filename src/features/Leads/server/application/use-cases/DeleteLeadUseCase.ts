import type { ILeadRepository } from "../../domain/interfaces/ILeadRepository";

export interface DeleteLeadInput {
  leadId: string;
  tenantId: string;
}

export interface DeleteLeadOutput {
  success: boolean;
  error?: string;
}

export class DeleteLeadUseCase {
  constructor(private readonly leadRepository: ILeadRepository) {}

  async execute(input: DeleteLeadInput): Promise<DeleteLeadOutput> {
    try {
      // Verificar que el lead existe
      const existingLead = await this.leadRepository.findById(
        input.leadId,
        input.tenantId
      );

      if (!existingLead) {
        return {
          success: false,
          error: "Lead no encontrado",
        };
      }

      if (existingLead.isDeleted) {
        return {
          success: false,
          error: "El lead ya está eliminado",
        };
      }

      const deleted = await this.leadRepository.delete(
        input.leadId,
        input.tenantId
      );

      if (!deleted) {
        return {
          success: false,
          error: "Error al eliminar lead",
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error in DeleteLeadUseCase:", error);
      return {
        success: false,
        error: "Error al eliminar lead",
      };
    }
  }
}
