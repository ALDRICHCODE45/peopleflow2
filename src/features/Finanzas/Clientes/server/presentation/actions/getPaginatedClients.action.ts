"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";

import { prismaClientRepository } from "../../infrastructure/repositories/PrismaClientRepository";
import { GetPaginatedClientsUseCase } from "../../application/use-cases/GetPaginatedClientsUseCase";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { ServerErrors } from "@core/shared/constants/error-messages";

import type { ClientDTO } from "../../../frontend/types/client.types";
import type {
  PaginationMeta,
  SortingParam,
} from "@/core/shared/types/pagination.types";

export interface GetPaginatedClientsParams {
  pageIndex: number;
  pageSize: number;
  sorting?: SortingParam[];
  globalFilter?: string;
}

export interface GetPaginatedClientsResult {
  error?: string;
  data?: ClientDTO[];
  pagination?: PaginationMeta;
}

/**
 * Obtiene clientes con paginación server-side
 */
export async function getPaginatedClientsAction(
  params: GetPaginatedClientsParams,
): Promise<GetPaginatedClientsResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: ServerErrors.notAuthenticated };
    }

    const tenantId = await getActiveTenantId();

    if (!tenantId) {
      return { error: ServerErrors.noActiveTenant };
    }

    // Verificar permisos
    const hasAnyPermissionUseCase = new CheckAnyPermissonUseCase();
    const hasPermission = await hasAnyPermissionUseCase.execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.clientes.acceder,
        PermissionActions.clientes.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "No tienes permisos para ver clientes" };
    }

    const useCase = new GetPaginatedClientsUseCase(prismaClientRepository);
    const result = await useCase.execute({
      tenantId,
      pageIndex: params.pageIndex,
      pageSize: params.pageSize,
      sorting: params.sorting,
      globalFilter: params.globalFilter,
    });

    if (!result.success) {
      return { error: result.error || "Error al obtener clientes" };
    }

    const totalCount = result.totalCount || 0;
    const pageSize = params.pageSize || 10;

    return {
      data: result.data?.map((client) => client.toJSON()) || [],
      pagination: {
        pageIndex: params.pageIndex,
        pageSize,
        totalCount,
        pageCount: Math.ceil(totalCount / pageSize),
      },
    };
  } catch (error) {
    console.error("Error getting paginated clients:", error);
    return { error: "Error al obtener clientes" };
  }
}
