import type {
  IClientRepository,
  PaginatedClientResult,
} from "../../domain/interfaces/IClientRepository";
import { Client } from "../../domain/entities/Client";

export interface GetPaginatedClientsInput {
  tenantId: string;
  pageIndex: number;
  pageSize: number;
  sorting?: { id: string; desc: boolean }[];
  globalFilter?: string;
}

export interface GetPaginatedClientsOutput {
  success: boolean;
  data?: Client[];
  totalCount?: number;
  error?: string;
}

export class GetPaginatedClientsUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(input: GetPaginatedClientsInput): Promise<GetPaginatedClientsOutput> {
    try {
      // Validación de parámetros de paginación
      const pageSize = Math.min(Math.max(input.pageSize, 1), 100); // Entre 1 y 100
      const pageIndex = Math.max(input.pageIndex, 0);

      const result: PaginatedClientResult = await this.clientRepository.findPaginated({
        tenantId: input.tenantId,
        skip: pageIndex * pageSize,
        take: pageSize,
        sorting: input.sorting,
        filters: {
          ...(input.globalFilter && { search: input.globalFilter }),
        },
      });

      return {
        success: true,
        data: result.data,
        totalCount: result.totalCount,
      };
    } catch (error) {
      console.error("Error in GetPaginatedClientsUseCase:", error);
      return {
        success: false,
        error: "Error al obtener clientes",
      };
    }
  }
}
