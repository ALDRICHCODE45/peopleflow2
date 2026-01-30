import type {
  ILeadStatusHistoryRepository,
  LeadStatusHistoryItem,
} from "../../domain/interfaces/ILeadStatusHistoryRepository";

export interface GetLeadStatusHistoryInput {
  leadId: string;
  tenantId: string;
}

export interface GetLeadStatusHistoryOutput {
  success: boolean;
  history?: LeadStatusHistoryItem[];
  error?: string;
}

export class GetLeadStatusHistoryUseCase {
  constructor(
    private readonly statusHistoryRepository: ILeadStatusHistoryRepository
  ) {}

  async execute(
    input: GetLeadStatusHistoryInput
  ): Promise<GetLeadStatusHistoryOutput> {
    try {
      const history = await this.statusHistoryRepository.findByLeadId(
        input.leadId,
        input.tenantId
      );

      return {
        success: true,
        history,
      };
    } catch (error) {
      console.error("Error in GetLeadStatusHistoryUseCase:", error);
      return {
        success: false,
        error: "Error al obtener historial de estados",
      };
    }
  }
}
