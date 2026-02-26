import type { VacancyStatusType } from "@features/vacancy/frontend/types/vacancy.types";
import type { VacancyDTO } from "@features/vacancy/frontend/types/vacancy.types";
import type {
  IVacancyRepository,
  FindVacanciesFilters,
} from "../../domain/interfaces/IVacancyRepository";
import type {
  PaginatedResponse,
  SortingParam,
} from "@/core/shared/types/pagination.types";
import { calculatePageCount } from "@/core/shared/types/pagination.types";

export interface GetPaginatedVacanciesInput {
  tenantId: string;
  pageIndex: number;
  pageSize: number;
  sorting?: SortingParam[];
  filters?: {
    statuses?: VacancyStatusType[];
    recruiterId?: string;
    clientId?: string;
    countryCode?: string;
    search?: string;
  };
}

export interface GetPaginatedVacanciesOutput {
  success: boolean;
  data?: PaginatedResponse<VacancyDTO>;
  error?: string;
}

/**
 * Use Case para obtener vacantes con paginación server-side.
 * Optimizado para TanStack Table con manualPagination.
 */
export class GetPaginatedVacanciesUseCase {
  constructor(private readonly vacancyRepo: IVacancyRepository) {}

  async execute(
    input: GetPaginatedVacanciesInput
  ): Promise<GetPaginatedVacanciesOutput> {
    try {
      // 1. Clamp pagination params
      const validPageIndex = Math.max(0, input.pageIndex);
      const validPageSize = Math.min(100, Math.max(1, input.pageSize));

      // 2. Calculate skip
      const skip = validPageIndex * validPageSize;

      // 3. Build filters
      const filters: FindVacanciesFilters = {};
      if (input.filters?.statuses?.length) filters.statuses = input.filters.statuses;
      if (input.filters?.recruiterId) filters.recruiterId = input.filters.recruiterId;
      if (input.filters?.clientId) filters.clientId = input.filters.clientId;
      if (input.filters?.countryCode) filters.countryCode = input.filters.countryCode;
      if (input.filters?.search) filters.search = input.filters.search;

      // 4. Execute paginated query
      const result = await this.vacancyRepo.findPaginated({
        tenantId: input.tenantId,
        skip,
        take: validPageSize,
        sorting: input.sorting,
        filters,
      });

      // 5. Map entities to DTOs
      const data: VacancyDTO[] = result.data.map((v) => v.toJSON());

      // 6. Calculate page count and return
      return {
        success: true,
        data: {
          data,
          pagination: {
            pageIndex: validPageIndex,
            pageSize: validPageSize,
            totalCount: result.totalCount,
            pageCount: calculatePageCount(result.totalCount, validPageSize),
          },
        },
      };
    } catch (error) {
      console.error("Error in GetPaginatedVacanciesUseCase:", error);
      return {
        success: false,
        error: "Error al obtener las vacantes paginadas",
      };
    }
  }
}
