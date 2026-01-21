"use server";

import { prismaUserRoleRepository } from "@/features/auth-rbac/server/infrastructure/repositories/PrismaUserRoleRepository";
import { auth } from "@/core/lib/auth";
import { headers } from "next/headers";
import { getCurrentTenantAction } from "@/features/tenants/server/presentation/actions/tenant.actions";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { GetPaginatedUsersUseCase } from "../../application/use-cases/GetPaginatedUsersUseCase";
import {
  PaginatedActionResponse,
  SortingParam,
} from "@/core/shared/types/pagination.types";
import type { TenantUser } from "@/features/Administracion/usuarios/frontend/types";

/** Parámetros de entrada para la acción paginada */
export interface GetPaginatedUsersParams {
  pageIndex: number;
  pageSize: number;
  sorting?: SortingParam[];
  globalFilter?: string;
}

/**
 * Server Action para obtener usuarios con paginación server-side
 * Optimizada para TanStack Table con manualPagination
 */
export async function getPaginatedUsersAction(
  params: GetPaginatedUsersParams
): Promise<PaginatedActionResponse<TenantUser>> {
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
    const tenantResult = await getCurrentTenantAction();
    if (tenantResult.error || !tenantResult.tenant) {
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

    const tenantId = tenantResult.tenant.id;

    // Verificar los permisos necesarios para ejecutar la acción
    const hasAnyPermissionUseCase = new CheckAnyPermissonUseCase();

    const hasAnyPermission = await hasAnyPermissionUseCase.execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.usuarios.acceder,
        PermissionActions.usuarios.gestionar,
      ],
      tenantId,
    });

    if (!hasAnyPermission) {
      return {
        error: "Sin permisos para acceder a usuarios",
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
    const allowedSortColumns = ["email", "name", "createdAt"];
    const validatedSorting = params.sorting?.filter((s) =>
      allowedSortColumns.includes(s.id)
    );

    // Ejecutar el use case
    const useCase = new GetPaginatedUsersUseCase(prismaUserRoleRepository);
    const result = await useCase.execute({
      tenantId,
      pageIndex,
      pageSize,
      sorting: validatedSorting,
      filters: {
        search: params.globalFilter,
      },
    });

    if (!result.success || !result.data) {
      return {
        error: result.error || "Error al obtener usuarios",
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
    console.error("Error in getPaginatedUsersAction:", error);
    return {
      error: "Error al obtener usuarios",
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
