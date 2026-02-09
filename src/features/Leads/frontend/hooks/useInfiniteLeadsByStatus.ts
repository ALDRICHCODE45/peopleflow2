"use client";

import {
  useInfiniteQuery,
  infiniteQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import type { LeadStatus, Lead } from "../types";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { getPaginatedLeadsAction } from "../../server/presentation/actions/getPaginatedLeadsAction.action";
import type { PaginationMeta } from "@/core/shared/types/pagination.types";

const PAGE_SIZE = 20; // Leads per page per column

export interface KanbanFilters {
  search?: string;
  sectorIds?: string[];
  originIds?: string[];
  assignedToIds?: string[];
  employeeCounts?: string[];
  countryCodes?: string[];
  regionCodes?: string[];
  postalCode?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
}

interface InfiniteLeadsPage {
  data: Lead[];
  pagination: PaginationMeta;
}

/**
 * Creates query options for infinite leads by status
 */
export const getInfiniteLeadsQueryOptions = (
  tenantId: string,
  status: LeadStatus,
  filters: KanbanFilters
) =>
  infiniteQueryOptions({
    queryKey: [
      "leads",
      "infinite",
      tenantId,
      status,
      {
        search: filters.search,
        sectorIds: filters.sectorIds,
        originIds: filters.originIds,
        assignedToIds: filters.assignedToIds,
        employeeCounts: filters.employeeCounts,
        countryCodes: filters.countryCodes,
        regionCodes: filters.regionCodes,
        postalCode: filters.postalCode,
        createdAtFrom: filters.createdAtFrom,
        createdAtTo: filters.createdAtTo,
      },
    ] as const,
    queryFn: async ({ pageParam }): Promise<InfiniteLeadsPage> => {
      const result = await getPaginatedLeadsAction({
        pageIndex: pageParam,
        pageSize: PAGE_SIZE,
        statuses: [status],
        globalFilter: filters.search,
        sectorIds: filters.sectorIds,
        originIds: filters.originIds,
        assignedToIds: filters.assignedToIds,
        employeeCounts: filters.employeeCounts,
        countryCodes: filters.countryCodes,
        regionCodes: filters.regionCodes,
        postalCode: filters.postalCode,
        createdAtFrom: filters.createdAtFrom,
        createdAtTo: filters.createdAtTo,
        minimal: true, // Use minimal includes for Kanban cards
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return {
        data: result.data ?? [],
        pagination: result.pagination ?? {
          pageIndex: pageParam,
          pageSize: PAGE_SIZE,
          totalCount: 0,
          pageCount: 0,
        },
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.length * PAGE_SIZE;
      return totalLoaded < lastPage.pagination.totalCount
        ? allPages.length
        : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
  });

/**
 * Hook for infinite scrolling leads by status (one query per kanban column)
 */
export function useInfiniteLeadsByStatus(
  status: LeadStatus,
  filters: KanbanFilters
) {
  const { tenant } = useTenant();

  return useInfiniteQuery({
    queryKey: [
      "leads",
      "infinite",
      tenant?.id ?? "no-tenant",
      status,
      {
        search: filters.search,
        sectorIds: filters.sectorIds,
        originIds: filters.originIds,
        assignedToIds: filters.assignedToIds,
        employeeCounts: filters.employeeCounts,
        countryCodes: filters.countryCodes,
        regionCodes: filters.regionCodes,
        postalCode: filters.postalCode,
        createdAtFrom: filters.createdAtFrom,
        createdAtTo: filters.createdAtTo,
      },
    ] as const,
    queryFn: async ({ pageParam }): Promise<InfiniteLeadsPage> => {
      if (!tenant?.id) {
        return {
          data: [],
          pagination: {
            pageIndex: 0,
            pageSize: PAGE_SIZE,
            totalCount: 0,
            pageCount: 0,
          },
        };
      }

      const result = await getPaginatedLeadsAction({
        pageIndex: pageParam,
        pageSize: PAGE_SIZE,
        statuses: [status],
        globalFilter: filters.search,
        sectorIds: filters.sectorIds,
        originIds: filters.originIds,
        assignedToIds: filters.assignedToIds,
        employeeCounts: filters.employeeCounts,
        countryCodes: filters.countryCodes,
        regionCodes: filters.regionCodes,
        postalCode: filters.postalCode,
        createdAtFrom: filters.createdAtFrom,
        createdAtTo: filters.createdAtTo,
        minimal: true, // Use minimal includes for Kanban cards
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return {
        data: result.data ?? [],
        pagination: result.pagination ?? {
          pageIndex: pageParam,
          pageSize: PAGE_SIZE,
          totalCount: 0,
          pageCount: 0,
        },
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.length * PAGE_SIZE;
      return totalLoaded < lastPage.pagination.totalCount
        ? allPages.length
        : undefined;
    },
    enabled: !!tenant?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
  });
}

export type UseInfiniteLeadsByStatusReturn = ReturnType<
  typeof useInfiniteLeadsByStatus
>;
