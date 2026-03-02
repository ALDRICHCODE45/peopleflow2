import type {
  VacancyStatusType,
  VacancySaleType,
  VacancyModality,
  VacancyDTO,
} from "@features/vacancy/frontend/types/vacancy.types";
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
    saleTypes?: VacancySaleType[];
    modalities?: VacancyModality[];
    recruiterIds?: string[];
    clientIds?: string[];
    countryCodes?: string[];
    regionCodes?: string[];
    requiresPsychometry?: boolean;
    salaryMin?: number;
    salaryMax?: number;
    assignedAtFrom?: string;
    assignedAtTo?: string;
    targetDeliveryDateFrom?: string;
    targetDeliveryDateTo?: string;
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
      if (input.filters?.saleTypes?.length) filters.saleTypes = input.filters.saleTypes;
      if (input.filters?.modalities?.length) filters.modalities = input.filters.modalities;
      if (input.filters?.recruiterIds?.length) filters.recruiterIds = input.filters.recruiterIds;
      if (input.filters?.clientIds?.length) filters.clientIds = input.filters.clientIds;
      if (input.filters?.countryCodes?.length) filters.countryCodes = input.filters.countryCodes;
      if (input.filters?.regionCodes?.length) filters.regionCodes = input.filters.regionCodes;
      if (input.filters?.requiresPsychometry !== undefined) filters.requiresPsychometry = input.filters.requiresPsychometry;
      if (input.filters?.salaryMin !== undefined) filters.salaryMin = input.filters.salaryMin;
      if (input.filters?.salaryMax !== undefined) filters.salaryMax = input.filters.salaryMax;
      if (input.filters?.assignedAtFrom) filters.assignedAtFrom = input.filters.assignedAtFrom;
      if (input.filters?.assignedAtTo) filters.assignedAtTo = input.filters.assignedAtTo;
      if (input.filters?.targetDeliveryDateFrom) filters.targetDeliveryDateFrom = input.filters.targetDeliveryDateFrom;
      if (input.filters?.targetDeliveryDateTo) filters.targetDeliveryDateTo = input.filters.targetDeliveryDateTo;
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
