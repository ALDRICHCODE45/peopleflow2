"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { LeadStatus, Lead } from "../types";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { getPaginatedLeadsAction } from "../../server/presentation/actions/getPaginatedLeadsAction.action";
import type {
  PaginatedResponse,
  SortingParam,
} from "@/core/shared/types/pagination.types";

/** Parámetros para la query paginada de leads */
export interface PaginatedLeadsQueryParams {
  pageIndex: number;
  pageSize: number;
  sorting?: SortingParam[];
  globalFilter?: string;
  statuses?: LeadStatus[];
  sectorIds?: string[];
  originIds?: string[];
  assignedToIds?: string[];
  employeeCounts?: string[];
  createdAtFrom?: string;
  createdAtTo?: string;
}

/** Query Key Factory */
export const getPaginatedLeadsQueryKey = (
  tenantId: string,
  params: PaginatedLeadsQueryParams
) =>
  [
    "leads",
    "paginated",
    tenantId,
    {
      pageIndex: params.pageIndex,
      pageSize: params.pageSize,
      sorting: params.sorting,
      globalFilter: params.globalFilter,
      statuses: params.statuses,
      sectorIds: params.sectorIds,
      originIds: params.originIds,
      assignedToIds: params.assignedToIds,
      employeeCounts: params.employeeCounts,
      createdAtFrom: params.createdAtFrom,
      createdAtTo: params.createdAtTo,
    },
  ] as const;

/**
 * Hook para obtener leads con paginación server-side
 */
export function usePaginatedLeadsQuery(params: PaginatedLeadsQueryParams) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id
      ? getPaginatedLeadsQueryKey(tenant.id, params)
      : ["leads", "paginated", "no-tenant"],
    queryFn: async (): Promise<PaginatedResponse<Lead>> => {
      const result = await getPaginatedLeadsAction({
        pageIndex: params.pageIndex,
        pageSize: params.pageSize,
        sorting: params.sorting,
        globalFilter: params.globalFilter,
        statuses: params.statuses,
        sectorIds: params.sectorIds,
        originIds: params.originIds,
        assignedToIds: params.assignedToIds,
        employeeCounts: params.employeeCounts,
        createdAtFrom: params.createdAtFrom,
        createdAtTo: params.createdAtTo,
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
    staleTime: 5 * 60 * 1000, // 5 minutes - reduces unnecessary refetches
  });
}
