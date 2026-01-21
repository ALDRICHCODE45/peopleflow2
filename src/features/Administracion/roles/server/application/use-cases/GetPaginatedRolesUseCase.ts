import prisma from "@lib/prisma";
import { IUserRoleRepository } from "@/features/auth-rbac/server/domain/interfaces/IUserRoleRepository";
import { HIDDEN_ADMIN_ROLE_NAME } from "@/core/shared/constants/permissions";
import type { RoleWithStats } from "@/features/Administracion/roles/frontend/types";
import {
  PaginatedResponse,
  SortingParam,
  calculatePageCount,
} from "@/core/shared/types/pagination.types";
import { Prisma } from "@/core/generated/prisma/client";

export interface GetPaginatedRolesInput {
  requestingUserId: string;
  tenantId: string;
  pageIndex: number;
  pageSize: number;
  sorting?: SortingParam[];
  filters?: {
    search?: string;
  };
}

export interface GetPaginatedRolesOutput {
  success: boolean;
  data?: PaginatedResponse<RoleWithStats>;
  error?: string;
}

/**
 * Use Case para obtener roles con paginación server-side
 * Basado en GetRolesWithStatsUseCase, optimizado para TanStack Table
 */
export class GetPaginatedRolesUseCase {
  constructor(private readonly userRoleRepository: IUserRoleRepository) {}

  async execute(input: GetPaginatedRolesInput): Promise<GetPaginatedRolesOutput> {
    try {
      const { requestingUserId, tenantId, pageIndex, pageSize, sorting, filters } = input;

      // 1. Verificar autorización
      const isSuperAdmin = await this.userRoleRepository.isSuperAdmin(requestingUserId);

      if (!isSuperAdmin) {
        const belongsToTenant = await this.userRoleRepository.userBelongsToTenant(
          requestingUserId,
          tenantId
        );

        if (!belongsToTenant) {
          return {
            success: false,
            error: "No tienes acceso a este tenant",
          };
        }
      }

      // Validar parámetros de paginación
      const validPageIndex = Math.max(0, pageIndex);
      const validPageSize = Math.min(100, Math.max(1, pageSize));
      const skip = validPageIndex * validPageSize;

      // Construir where clause
      const whereClause: Prisma.RoleWhereInput = {
        AND: [
          {
            OR: [
              { tenantId: tenantId },
              { tenantId: null },
            ],
          },
          {
            name: { not: HIDDEN_ADMIN_ROLE_NAME },
          },
          // Filtro de búsqueda
          filters?.search
            ? {
                name: { contains: filters.search, mode: "insensitive" },
              }
            : {},
        ],
      };

      // Construir orderBy
      const orderBy = this.buildSorting(sorting);

      // Ejecutar COUNT y SELECT en paralelo
      const [totalCount, roles] = await Promise.all([
        prisma.role.count({ where: whereClause }),
        prisma.role.findMany({
          where: whereClause,
          include: {
            _count: {
              select: {
                permissions: true,
              },
            },
            users: {
              where: {
                tenantId: tenantId,
              },
              select: {
                id: true,
              },
            },
          },
          orderBy,
          skip,
          take: validPageSize,
        }),
      ]);

      // Mapear resultados
      const rolesWithStats: RoleWithStats[] = roles.map((role) => ({
        id: role.id,
        name: role.name,
        permissionsCount: role._count.permissions,
        usersCount: role.users.length,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      }));

      return {
        success: true,
        data: {
          data: rolesWithStats,
          pagination: {
            pageIndex: validPageIndex,
            pageSize: validPageSize,
            totalCount,
            pageCount: calculatePageCount(totalCount, validPageSize),
          },
        },
      };
    } catch (error) {
      console.error("Error in GetPaginatedRolesUseCase:", error);
      return {
        success: false,
        error: "Error al obtener roles paginados",
      };
    }
  }

  /**
   * Construye el orderBy para Prisma
   */
  private buildSorting(
    sorting?: SortingParam[]
  ): Prisma.RoleOrderByWithRelationInput | Prisma.RoleOrderByWithRelationInput[] {
    // Whitelist de columnas permitidas
    const allowedSortColumns = ["name", "createdAt", "updatedAt"];

    if (!sorting || sorting.length === 0) {
      return { createdAt: "asc" };
    }

    const validSorting = sorting.filter((s) => allowedSortColumns.includes(s.id));
    if (validSorting.length === 0) {
      return { createdAt: "asc" };
    }

    return validSorting.map((s) => ({
      [s.id]: s.desc ? "desc" : "asc",
    }));
  }
}
