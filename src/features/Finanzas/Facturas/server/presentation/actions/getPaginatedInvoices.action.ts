"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";

import { prismaInvoiceRepository } from "../../infrastructure/repositories/PrismaInvoiceRepository";
import { GetPaginatedInvoicesUseCase } from "../../application/use-cases/GetPaginatedInvoicesUseCase";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { ServerErrors } from "@core/shared/constants/error-messages";

import type { InvoiceDTO } from "../../domain/entities/Invoice";
import type { InvoiceStatus, InvoiceType } from "@/core/generated/prisma/client";
import type {
  PaginationMeta,
  SortingParam,
} from "@/core/shared/types/pagination.types";

// --- Input / Output ---

export interface GetPaginatedInvoicesParams {
  pageIndex: number;
  pageSize: number;
  sorting?: SortingParam[];
  globalFilter?: string;
  // Filtros específicos de facturas
  status?: InvoiceStatus;
  type?: InvoiceType;
  clientId?: string;
  dateFrom?: string; // ISO string
  dateTo?: string; // ISO string
}

export interface GetPaginatedInvoicesResult {
  error?: string;
  data?: InvoiceDTO[];
  pagination?: PaginationMeta;
}

/**
 * Obtiene facturas con paginación server-side y filtros
 */
export async function getPaginatedInvoicesAction(
  params: GetPaginatedInvoicesParams,
): Promise<GetPaginatedInvoicesResult> {
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
    const permissionCheck = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.facturas.acceder,
        PermissionActions.facturas.gestionar,
      ],
      tenantId,
    });

    if (!permissionCheck.hasAnyPermission) {
      return { error: "No tienes permisos para ver facturas" };
    }

    // Ejecutar caso de uso
    const useCase = new GetPaginatedInvoicesUseCase(prismaInvoiceRepository);
    const result = await useCase.execute({
      tenantId,
      pageIndex: params.pageIndex,
      pageSize: params.pageSize,
      sorting: params.sorting,
      globalFilter: params.globalFilter,
      status: params.status,
      type: params.type,
      clientId: params.clientId,
      dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
      dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al obtener facturas" };
    }

    const totalCount = result.totalCount ?? 0;
    const pageSize = params.pageSize || 10;

    const invoiceDTOs = result.data?.map((invoice) => invoice.toJSON()) ?? [];

    return {
      data: invoiceDTOs,
      pagination: {
        pageIndex: params.pageIndex,
        pageSize,
        totalCount,
        pageCount: Math.ceil(totalCount / pageSize),
      },
    };
  } catch (error) {
    console.error("Error getting paginated invoices:", error);
    return { error: "Error al obtener facturas" };
  }
}
