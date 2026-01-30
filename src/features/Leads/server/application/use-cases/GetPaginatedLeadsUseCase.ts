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
    statuses?: LeadStatusType[];
    sectorIds?: string[];
    originIds?: string[];
    assignedToIds?: string[];
    search?: string;
  };
  /** If true, uses minimal includes for faster Kanban queries */
  minimal?: boolean;
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
        ...(input.filters?.statuses?.length && { statuses: input.filters.statuses }),
        ...(input.filters?.sectorIds?.length && { sectorIds: input.filters.sectorIds }),
        ...(input.filters?.originIds?.length && { originIds: input.filters.originIds }),
        ...(input.filters?.assignedToIds?.length && { assignedToIds: input.filters.assignedToIds }),
        ...(input.filters?.search && { search: input.filters.search }),
      };

      const result: PaginatedResult<Lead> = await this.leadRepository.findPaginated({
        tenantId: input.tenantId,
        skip: pageIndex * pageSize,
        take: pageSize,
        sorting: input.sorting,
        filters,
        minimal: input.minimal,
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
