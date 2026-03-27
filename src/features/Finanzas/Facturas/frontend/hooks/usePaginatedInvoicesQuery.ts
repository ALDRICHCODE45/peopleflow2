"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { invoiceQueryKeys } from "@core/shared/constants/query-keys";
import { getPaginatedInvoicesAction } from "../../server/presentation/actions/getPaginatedInvoices.action";
import type { InvoiceDTO } from "../types/invoice.types";
import type {
  PaginatedResponse,
  SortingParam,
} from "@/core/shared/types/pagination.types";
import type { InvoiceStatus, InvoiceType } from "@/core/generated/prisma/client";

/** Par\u00e1metros para la query paginada de facturas */
export interface PaginatedInvoicesQueryParams {
  pageIndex: number;
  pageSize: number;
  sorting?: SortingParam[];
  globalFilter?: string;
  // Filtros espec\u00edficos de facturas
  status?: InvoiceStatus;
  type?: InvoiceType;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/** Query Key Factory \u2014 builds the full key including params */
export const getPaginatedInvoicesQueryKey = (
  tenantId: string,
  params: PaginatedInvoicesQueryParams,
) =>
  [
    ...invoiceQueryKeys.all(tenantId),
    {
      pageIndex: params.pageIndex,
      pageSize: params.pageSize,
      sorting: params.sorting,
      globalFilter: params.globalFilter,
      status: params.status,
      type: params.type,
      clientId: params.clientId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    },
  ] as const;

/**
 * Hook para obtener facturas con paginaci\u00f3n server-side
 * Optimizado para TanStack Table con manualPagination
 */
export function usePaginatedInvoicesQuery(params: PaginatedInvoicesQueryParams) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id
      ? getPaginatedInvoicesQueryKey(tenant.id, params)
      : ["invoices", "paginated", "no-tenant"],
    queryFn: async (): Promise<PaginatedResponse<InvoiceDTO>> => {
      const result = await getPaginatedInvoicesAction({
        pageIndex: params.pageIndex,
        pageSize: params.pageSize,
        sorting: params.sorting,
        globalFilter: params.globalFilter,
        status: params.status,
        type: params.type,
        clientId: params.clientId,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      });

      if ("error" in result && result.error) {
        throw new Error(result.error);
      }

      return {
        data: result.data ?? [],
        pagination: result.pagination ?? {
          pageIndex: params.pageIndex,
          pageSize: params.pageSize,
          totalCount: 0,
          pageCount: 0,
        },
      };
    },
    enabled: !!tenant?.id,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
