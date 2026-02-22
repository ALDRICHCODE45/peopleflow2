import type { ILeadRepository } from "../../domain/interfaces/ILeadRepository";

export interface BulkDeleteLeadsInput {
  leadIds: string[];
  tenantId: string;
}

export interface BulkDeleteLeadsOutput {
  success: boolean;
  deletedCount?: number;
  error?: string;
}

export class BulkDeleteLeadsUseCase {
  constructor(private readonly leadRepository: ILeadRepository) {}

  async execute(input: BulkDeleteLeadsInput): Promise<BulkDeleteLeadsOutput> {
    try {
      if (input.leadIds.length === 0) {
        return {
          success: false,
          error: "No se proporcionaron leads para eliminar",
        };
      }

      const deletedCount = await this.leadRepository.deleteMany(
        input.leadIds,
        input.tenantId,
      );

      if (deletedCount === 0) {
        return {
          success: false,
          error: "No se encontraron leads para eliminar",
        };
      }

      return {
        success: true,
        deletedCount,
      };
    } catch (error) {
      console.error("Error in BulkDeleteLeadsUseCase:", error);
      return {
        success: false,
        error: "Error al eliminar leads",
      };
    }
  }
}
