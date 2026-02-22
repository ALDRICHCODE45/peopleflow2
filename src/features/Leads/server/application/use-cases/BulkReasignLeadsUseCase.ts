import type { ILeadRepository } from "../../domain/interfaces/ILeadRepository";

export interface BulkReasignLeadsInput {
  leadIds: string[];
  newUserId: string;
  tenantId: string;
}

export interface BulkReasignLeadsOutput {
  success: boolean;
  reasignedCount?: number;
  error?: string;
}

export class BulkReasignLeadsUseCase {
  constructor(private readonly leadRepository: ILeadRepository) {}

  async execute(
    input: BulkReasignLeadsInput,
  ): Promise<BulkReasignLeadsOutput> {
    try {
      if (input.leadIds.length === 0) {
        return {
          success: false,
          error: "No se proporcionaron leads para reasignar",
        };
      }

      if (!input.newUserId || input.newUserId.length < 1) {
        return {
          success: false,
          error: "ID de usuario inválido",
        };
      }

      const reasignedCount = await this.leadRepository.reasignMany(
        input.leadIds,
        input.newUserId,
        input.tenantId,
      );

      if (reasignedCount === 0) {
        return {
          success: false,
          error: "No se pudieron reasignar los leads. Verifica que el usuario pertenezca al tenant.",
        };
      }

      return {
        success: true,
        reasignedCount,
      };
    } catch (error) {
      console.error("Error in BulkReasignLeadsUseCase:", error);
      return {
        success: false,
        error: "Error al reasignar leads",
      };
    }
  }
}
