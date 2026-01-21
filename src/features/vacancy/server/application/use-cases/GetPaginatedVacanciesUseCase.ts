import { IVacancyRepository } from "../../domain/interfaces/IVacancyRepository";
import { VacancyStatus } from "../../domain/entities/Vacancy";
import {
  PaginatedResponse,
  SortingParam,
  calculatePageCount,
} from "@/core/shared/types/pagination.types";
import { Vacancy as VacancyType } from "@/features/vacancy/frontend/types/vacancy.types";

export interface GetPaginatedVacanciesInput {
  tenantId: string;
  pageIndex: number;
  pageSize: number;
  sorting?: SortingParam[];
  filters?: {
    status?: VacancyStatus;
    search?: string;
    department?: string;
  };
}

export interface GetPaginatedVacanciesOutput {
  success: boolean;
  data?: PaginatedResponse<VacancyType>;
  error?: string;
}

/**
 * Use Case para obtener vacantes con paginación server-side
 * Optimizado para TanStack Table con manualPagination
 */
export class GetPaginatedVacanciesUseCase {
  constructor(private readonly vacancyRepository: IVacancyRepository) {}

  async execute(
    input: GetPaginatedVacanciesInput
  ): Promise<GetPaginatedVacanciesOutput> {
    try {
      const { tenantId, pageIndex, pageSize, sorting, filters } = input;

      // Validar parámetros de paginación
      const validPageIndex = Math.max(0, pageIndex);
      const validPageSize = Math.min(100, Math.max(1, pageSize));

      // Calcular skip para la base de datos
      const skip = validPageIndex * validPageSize;

      // Ejecutar query paginada
      const result = await this.vacancyRepository.findPaginated({
        tenantId,
        skip,
        take: validPageSize,
        sorting,
        filters: {
          status: filters?.status,
          search: filters?.search,
          department: filters?.department,
        },
      });

      // Mapear entidades de dominio a DTOs
      const vacanciesDto: VacancyType[] = result.data.map((v) => v.toJSON());

      return {
        success: true,
        data: {
          data: vacanciesDto,
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
        error: "Error al obtener vacantes paginadas",
      };
    }
  }
}
