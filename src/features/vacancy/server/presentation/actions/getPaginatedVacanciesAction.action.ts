"use server";

import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { VacancyStatus } from "@/core/generated/prisma/enums";
import { auth } from "@/core/lib/auth";
import { headers } from "next/headers";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { GetPaginatedVacanciesUseCase } from "../../application/use-cases/GetPaginatedVacanciesUseCase";
import {
  PaginatedActionResponse,
  SortingParam,
} from "@/core/shared/types/pagination.types";
import { Vacancy } from "@/features/vacancy/frontend/types/vacancy.types";

/** Parámetros de entrada para la acción paginada */
export interface GetPaginatedVacanciesParams {
  pageIndex: number;
  pageSize: number;
  sorting?: SortingParam[];
  globalFilter?: string;
  status?: VacancyStatus;
}

/**
 * Server Action para obtener vacantes con paginación server-side
 * Optimizada para TanStack Table con manualPagination
 */
export async function getPaginatedVacanciesAction(
  params: GetPaginatedVacanciesParams
): Promise<PaginatedActionResponse<Vacancy>> {
  try {
    // Obtener la sesión del usuario
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return {
        error: "No autenticado",
        data: [],
        pagination: {
          pageIndex: 0,
          pageSize: params.pageSize || 10,
          totalCount: 0,
          pageCount: 0,
        },
      };
    }

    // Obtener el tenant activo del usuario
    const tenantId = await getActiveTenantId();
    if (!tenantId) {
      return {
        error: "No hay tenant activo",
        data: [],
        pagination: {
          pageIndex: 0,
          pageSize: params.pageSize || 10,
          totalCount: 0,
          pageCount: 0,
        },
      };
    }

    // Verificar los permisos necesarios para ejecutar la acción
    const hasAnyPermissionUseCase = new CheckAnyPermissonUseCase();

    const hasAnyPermission = await hasAnyPermissionUseCase.execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.vacantes.acceder,
        PermissionActions.vacantes.gestionar,
      ],
      tenantId,
    });

    if (!hasAnyPermission) {
      return {
        error: "Sin permisos para acceder a vacantes",
        data: [],
        pagination: {
          pageIndex: 0,
          pageSize: params.pageSize || 10,
          totalCount: 0,
          pageCount: 0,
        },
      };
    }

    // Validar y sanitizar parámetros
    const pageIndex = Math.max(0, params.pageIndex ?? 0);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10));

    // Whitelist de columnas permitidas para sorting (previene SQL injection)
    const allowedSortColumns = [
      "title",
      "status",
      "department",
      "location",
      "createdAt",
      "updatedAt",
    ];
    const validatedSorting = params.sorting?.filter((s) =>
      allowedSortColumns.includes(s.id)
    );

    // Ejecutar el use case
    const useCase = new GetPaginatedVacanciesUseCase(prismaVacancyRepository);
    const result = await useCase.execute({
      tenantId,
      pageIndex,
      pageSize,
      sorting: validatedSorting,
      filters: {
        status: params.status,
        search: params.globalFilter,
      },
    });

    if (!result.success || !result.data) {
      return {
        error: result.error || "Error al obtener vacantes",
        data: [],
        pagination: {
          pageIndex,
          pageSize,
          totalCount: 0,
          pageCount: 0,
        },
      };
    }

    return result.data;
  } catch (error) {
    console.error("Error in getPaginatedVacanciesAction:", error);
    return {
      error: "Error al obtener vacantes",
      data: [],
      pagination: {
        pageIndex: 0,
        pageSize: params.pageSize || 10,
        totalCount: 0,
        pageCount: 0,
      },
    };
  }
}
