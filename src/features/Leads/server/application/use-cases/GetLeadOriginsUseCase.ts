import type {
  ILeadOriginRepository,
  LeadOrigin,
} from "../../domain/interfaces/ICatalogRepository";

export interface GetLeadOriginsInput {
  tenantId: string;
}

export interface GetLeadOriginsOutput {
  success: boolean;
  origins?: LeadOrigin[];
  error?: string;
}

export class GetLeadOriginsUseCase {
  constructor(private readonly leadOriginRepository: ILeadOriginRepository) {}

  async execute(input: GetLeadOriginsInput): Promise<GetLeadOriginsOutput> {
    try {
      const origins = await this.leadOriginRepository.findActive(input.tenantId);

      return {
        success: true,
        origins,
      };
    } catch (error) {
      console.error("Error in GetLeadOriginsUseCase:", error);
      return {
        success: false,
        error: "Error al obtener orígenes de leads",
      };
    }
  }
}
