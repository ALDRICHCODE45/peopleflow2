"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { ClientDTO } from "../types/client.types";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { getPaginatedClientsAction } from "../../server/presentation/actions/getPaginatedClients.action";
import type {
  PaginatedResponse,
  SortingParam,
} from "@/core/shared/types/pagination.types";

/** Parámetros para la query paginada de clientes */
export interface PaginatedClientsQueryParams {
  pageIndex: number;
  pageSize: number;
  sorting?: SortingParam[];
  globalFilter?: string;
}

/** Query Key Factory */
export const getPaginatedClientsQueryKey = (
  tenantId: string,
  params: PaginatedClientsQueryParams,
) =>
  [
    "clients",
    "paginated",
    tenantId,
    {
      pageIndex: params.pageIndex,
      pageSize: params.pageSize,
      sorting: params.sorting,
      globalFilter: params.globalFilter,
    },
  ] as const;

/**
 * Hook para obtener clientes con paginación server-side
 */
export function usePaginatedClientsQuery(params: PaginatedClientsQueryParams) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id
      ? getPaginatedClientsQueryKey(tenant.id, params)
      : ["clients", "paginated", "no-tenant"],
    queryFn: async (): Promise<PaginatedResponse<ClientDTO>> => {
      const result = await getPaginatedClientsAction({
        pageIndex: params.pageIndex,
        pageSize: params.pageSize,
        sorting: params.sorting,
        globalFilter: params.globalFilter,
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
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
