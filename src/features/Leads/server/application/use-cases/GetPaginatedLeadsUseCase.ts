import type {
  ILeadRepository,
  FindLeadsFilters,
  PaginatedResult,
} from "../../domain/interfaces/ILeadRepository";
import { Lead } from "../../domain/entities/Lead";
import type { LeadStatusType } from "../../domain/value-objects/LeadStatus";

export interface GetPaginatedLeadsInput {
  tenantId: string;
  pageIndex: number;
  pageSize: number;
  sorting?: { id: string; desc: boolean }[];
  filters?: {
    status?: LeadStatusType;
    sectorId?: string;
    originId?: string;
    assignedToId?: string;
    search?: string;
  };
}

export interface GetPaginatedLeadsOutput {
  success: boolean;
  data?: Lead[];
  totalCount?: number;
  error?: string;
}

export class GetPaginatedLeadsUseCase {
  constructor(private readonly leadRepository: ILeadRepository) {}

  async execute(input: GetPaginatedLeadsInput): Promise<GetPaginatedLeadsOutput> {
    try {
      // Validación de parámetros de paginación
      const pageSize = Math.min(Math.max(input.pageSize, 1), 100); // Entre 1 y 100
      const pageIndex = Math.max(input.pageIndex, 0);

      const filters: FindLeadsFilters = {
        isDeleted: false,
        ...(input.filters?.status && { status: input.filters.status }),
        ...(input.filters?.sectorId && { sectorId: input.filters.sectorId }),
        ...(input.filters?.originId && { originId: input.filters.originId }),
        ...(input.filters?.assignedToId && { assignedToId: input.filters.assignedToId }),
        ...(input.filters?.search && { search: input.filters.search }),
      };

      const result: PaginatedResult<Lead> = await this.leadRepository.findPaginated({
        tenantId: input.tenantId,
        skip: pageIndex * pageSize,
        take: pageSize,
        sorting: input.sorting,
        filters,
      });

      return {
        success: true,
        data: result.data,
        totalCount: result.totalCount,
      };
    } catch (error) {
      console.error("Error in GetPaginatedLeadsUseCase:", error);
      return {
        success: false,
        error: "Error al obtener leads",
      };
    }
  }
}
