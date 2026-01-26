"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";

// Repository
import { prismaLeadRepository } from "../../infrastructure/repositories/PrismaLeadRepository";

// Use Case
import { GetPaginatedLeadsUseCase } from "../../application/use-cases/GetPaginatedLeadsUseCase";

// Types
import type { LeadStatus, Lead } from "../../../frontend/types";
import type {
  PaginationMeta,
  SortingParam,
} from "@/core/shared/types/pagination.types";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";

export interface GetPaginatedLeadsParams {
  pageIndex: number;
  pageSize: number;
  sorting?: SortingParam[];
  globalFilter?: string;
  status?: LeadStatus;
  sectorId?: string;
  originId?: string;
}

export interface GetPaginatedLeadsResult {
  error?: string;
  data?: Lead[];
  pagination?: PaginationMeta;
}

/**
 * Obtiene leads con paginación server-side
 */
export async function getPaginatedLeadsAction(
  params: GetPaginatedLeadsParams,
): Promise<GetPaginatedLeadsResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado" };
    }

    const tenantId = await getActiveTenantId();

    if (!tenantId) {
      return { error: "No hay tenant activo" };
    }

    // Verificar permisos
    const hasAnyPermissionUseCase = new CheckAnyPermissonUseCase();
    const hasPermission = await hasAnyPermissionUseCase.execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.leads.acceder,
        PermissionActions.leads.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "No tienes permisos para ver leads" };
    }

    const useCase = new GetPaginatedLeadsUseCase(prismaLeadRepository);
    const result = await useCase.execute({
      tenantId,
      pageIndex: params.pageIndex,
      pageSize: params.pageSize,
      sorting: params.sorting,
      filters: {
        status: params.status,
        sectorId: params.sectorId,
        originId: params.originId,
        search: params.globalFilter,
      },
    });

    if (!result.success) {
      return { error: result.error || "Error al obtener leads" };
    }

    const totalCount = result.totalCount || 0;
    const pageSize = params.pageSize || 10;

    return {
      data: result.data?.map((lead) => lead.toJSON()) || [],
      pagination: {
        pageIndex: params.pageIndex,
        pageSize,
        totalCount,
        pageCount: Math.ceil(totalCount / pageSize),
      },
    };
  } catch (error) {
    console.error("Error getting paginated leads:", error);
    return { error: "Error al obtener leads" };
  }
}
