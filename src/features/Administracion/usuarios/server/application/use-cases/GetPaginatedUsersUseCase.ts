import { IUserRoleRepository } from "@/features/auth-rbac/server/domain/interfaces/IUserRoleRepository";
import type { TenantUser } from "@/features/Administracion/usuarios/frontend/types";
import {
  PaginatedResponse,
  SortingParam,
  calculatePageCount,
} from "@/core/shared/types/pagination.types";

export interface GetPaginatedUsersInput {
  tenantId: string;
  pageIndex: number;
  pageSize: number;
  sorting?: SortingParam[];
  filters?: {
    search?: string;
  };
}

export interface GetPaginatedUsersOutput {
  success: boolean;
  data?: PaginatedResponse<TenantUser>;
  error?: string;
}

/**
 * Use Case para obtener usuarios con paginación server-side
 * Optimizado para TanStack Table con manualPagination
 */
export class GetPaginatedUsersUseCase {
  constructor(private readonly userRoleRepository: IUserRoleRepository) {}

  async execute(input: GetPaginatedUsersInput): Promise<GetPaginatedUsersOutput> {
    try {
      const { tenantId, pageIndex, pageSize, sorting, filters } = input;

      // Validar parámetros de paginación
      const validPageIndex = Math.max(0, pageIndex);
      const validPageSize = Math.min(100, Math.max(1, pageSize));

      // Calcular skip para la base de datos
      const skip = validPageIndex * validPageSize;

      // Ejecutar query paginada
      const result = await this.userRoleRepository.findPaginatedUsers({
        tenantId,
        skip,
        take: validPageSize,
        sorting,
        filters: {
          search: filters?.search,
        },
      });

      // Mapear a DTOs
      const usersDto: TenantUser[] = result.data.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        roles: user.roles,
        createdAt: user.createdAt,
      }));

      return {
        success: true,
        data: {
          data: usersDto,
          pagination: {
            pageIndex: validPageIndex,
            pageSize: validPageSize,
            totalCount: result.totalCount,
            pageCount: calculatePageCount(result.totalCount, validPageSize),
          },
        },
      };
    } catch (error) {
      console.error("Error in GetPaginatedUsersUseCase:", error);
      return {
        success: false,
        error: "Error al obtener usuarios paginados",
      };
    }
  }
}
