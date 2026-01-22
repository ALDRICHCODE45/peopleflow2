import type { ILeadRepository } from "../../domain/interfaces/ILeadRepository";
import { Lead } from "../../domain/entities/Lead";

export interface GetLeadByIdInput {
  leadId: string;
  tenantId: string;
}

export interface GetLeadByIdOutput {
  success: boolean;
  lead?: Lead;
  error?: string;
}

export class GetLeadByIdUseCase {
  constructor(private readonly leadRepository: ILeadRepository) {}

  async execute(input: GetLeadByIdInput): Promise<GetLeadByIdOutput> {
    try {
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

      return {
        success: true,
        lead,
      };
    } catch (error) {
      console.error("Error in GetLeadByIdUseCase:", error);
      return {
        success: false,
        error: "Error al obtener lead",
      };
    }
  }
}
