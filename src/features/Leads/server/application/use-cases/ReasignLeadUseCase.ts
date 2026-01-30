import { Lead } from "../../domain/entities/Lead";
import { ILeadRepository } from "../../domain/interfaces/ILeadRepository";

export interface ReasignLeadInput {
  leadId: string;
  newUserId: string;
  tenantId: string;
}

export interface ReasignLeadOutput {
  success: boolean;
  lead?: Lead;
  error?: string;
}

export class ReasignLeadUseCase {
  constructor(private readonly leadRepository: ILeadRepository) {}

  async execute(input: ReasignLeadInput): Promise<ReasignLeadOutput> {
    try {
      //validaciones de input
      if (!input.leadId || input.leadId.length < 5) {
        return {
          success: false,
          error: "Error reasignando el lead",
        };
      }

      if (!input.newUserId || input.newUserId.length < 5) {
        return {
          success: false,
          error: "Error reasignando el lead",
        };
      }

      if (!input.tenantId || input.tenantId.length < 5) {
        return {
          success: false,
          error: "Error reasignando el lead",
        };
      }

      const lead = await this.leadRepository.reasignLead(
        input.leadId,
        input.newUserId,
        input.tenantId,
      );

      if (!lead) {
        return {
          success: false,
          error: "Error al reasignar el lead",
        };
      }

      return {
        success: true,
        lead,
      };
    } catch (error) {
      console.error("Error in CreateLeadUseCase:", error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Error al crear lead",
      };
    }
  }
}
