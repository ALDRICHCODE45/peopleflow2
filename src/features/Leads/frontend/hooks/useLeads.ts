"use client";

import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from "@tanstack/react-query";
import { showToast } from "@/core/shared/components/ShowToast";
import type { LeadStatus, LeadFormData, Lead } from "../types";
import {
  createLeadAction,
  updateLeadAction,
  deleteLeadAction,
  updateLeadStatusAction,
} from "../../server/presentation/actions/lead.actions";
import type { PaginationMeta } from "@/core/shared/types/pagination.types";

interface InfiniteLeadsPage {
  data: Lead[];
  pagination: PaginationMeta;
}

type LeadsInfiniteData = InfiniteData<InfiniteLeadsPage, number>;

/**
 * Hook para crear un lead
 */
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LeadFormData) => {
      const result = await createLeadAction(data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.lead;
    },
    onSuccess: () => {
      // Invalidate both paginated and infinite queries
      queryClient.invalidateQueries({
        queryKey: ["leads"],
        refetchType: "active",
      });
      showToast({
        type: "success",
        title: "Lead creado",
        description: "El lead se ha creado correctamente",
      });
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al crear el lead",
      });
    },
  });
}

/**
 * Hook para actualizar un lead
 */
export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      data,
    }: {
      leadId: string;
      data: Partial<LeadFormData>;
    }) => {
      const result = await updateLeadAction(leadId, data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.lead;
    },
    onSuccess: () => {
      // Invalidate both paginated and infinite queries
      queryClient.invalidateQueries({
        queryKey: ["leads"],
        refetchType: "active",
      });
      showToast({
        type: "success",
        title: "Lead actualizado",
        description: "El lead se ha actualizado correctamente",
      });
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al actualizar el lead",
      });
    },
  });
}

/**
 * Hook para eliminar un lead
 */
export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const result = await deleteLeadAction(leadId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.success;
    },
    onSuccess: () => {
      // Invalidate both paginated and infinite queries
      queryClient.invalidateQueries({
        queryKey: ["leads"],
        refetchType: "active",
      });
      showToast({
        type: "success",
        title: "Lead eliminado",
        description: "El lead se ha eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al eliminar el lead",
      });
    },
  });
}

/**
 * Hook para actualizar el estado de un lead con actualizaciones optimistas
 * Optimized: Moves leads between columns instantly without waiting for server response
 */
export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      newStatus,
    }: {
      leadId: string;
      newStatus: LeadStatus;
    }) => {
      const result = await updateLeadStatusAction(leadId, newStatus);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.lead;
    },

    // Optimistic update: Move lead between columns instantly
    onMutate: async ({ leadId, newStatus }) => {
      // 1. Find the lead in infinite queries to get its current status
      const allInfiniteQueries = queryClient.getQueriesData<LeadsInfiniteData>({
        queryKey: ["leads", "infinite"],
      });

      let sourceStatus: LeadStatus | null = null;
      let leadToMove: Lead | null = null;
      let sourceQueryKey: QueryKey | null = null;

      // Search through all infinite queries to find the lead
      for (const [queryKey, data] of allInfiniteQueries) {
        if (!data?.pages) continue;
        for (const page of data.pages) {
          const foundLead = page.data?.find((l) => l.id === leadId);
          if (foundLead) {
            sourceStatus = foundLead.status;
            leadToMove = { ...foundLead, status: newStatus };
            sourceQueryKey = queryKey;
            break;
          }
        }
        if (leadToMove) break;
      }

      // If lead not found or already in target status, skip optimistic update
      if (!sourceStatus || !leadToMove || !sourceQueryKey || sourceStatus === newStatus) {
        return undefined;
      }

      // 2. Build destination query key (same structure, different status)
      // Query key structure: ["leads", "infinite", tenantId, status, filters]
      const destQueryKey = [
        sourceQueryKey[0], // "leads"
        sourceQueryKey[1], // "infinite"
        sourceQueryKey[2], // tenantId
        newStatus,         // new status
        sourceQueryKey[4], // filters
      ] as QueryKey;

      // 3. Cancel only affected queries to avoid race conditions
      await queryClient.cancelQueries({ queryKey: sourceQueryKey, exact: true });
      await queryClient.cancelQueries({ queryKey: destQueryKey, exact: true });

      // 4. Snapshot previous data for rollback
      const previousSourceData = queryClient.getQueryData<LeadsInfiniteData>(sourceQueryKey);
      const previousDestData = queryClient.getQueryData<LeadsInfiniteData>(destQueryKey);

      // 5. Remove lead from source column
      queryClient.setQueryData<LeadsInfiniteData>(sourceQueryKey, (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page, idx) => ({
            ...page,
            data: page.data?.filter((l) => l.id !== leadId) ?? [],
            pagination: idx === 0
              ? { ...page.pagination, totalCount: Math.max(0, page.pagination.totalCount - 1) }
              : page.pagination,
          })),
        };
      });

      // 6. Add lead to destination column (at the top of first page)
      queryClient.setQueryData<LeadsInfiniteData>(destQueryKey, (old) => {
        // If destination column has no data yet, create initial structure
        if (!old?.pages?.length) {
          return {
            pages: [{
              data: [leadToMove!],
              pagination: { pageIndex: 0, pageSize: 20, totalCount: 1, pageCount: 1 },
            }],
            pageParams: [0],
          };
        }
        return {
          ...old,
          pages: old.pages.map((page, idx) => ({
            ...page,
            data: idx === 0 ? [leadToMove!, ...(page.data ?? [])] : page.data,
            pagination: idx === 0
              ? { ...page.pagination, totalCount: page.pagination.totalCount + 1 }
              : page.pagination,
          })),
        };
      });

      return { previousSourceData, previousDestData, sourceQueryKey, destQueryKey };
    },

    // Rollback on error - restore previous data from both columns
    onError: (error: Error, _variables, context) => {
      if (context?.sourceQueryKey && context?.previousSourceData) {
        queryClient.setQueryData(context.sourceQueryKey, context.previousSourceData);
      }
      if (context?.destQueryKey && context?.previousDestData) {
        queryClient.setQueryData(context.destQueryKey, context.previousDestData);
      }

      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al actualizar el estado",
      });
    },

    onSuccess: () => {
      showToast({
        type: "success",
        title: "Estado actualizado",
        description: "El estado del lead se ha actualizado correctamente",
      });
    },

    // Only refetch on error to guarantee consistency
    // On success, the optimistic update is already correct
    onSettled: (_data, error, _variables, context) => {
      if (error && context) {
        // Refetch only affected columns on error
        if (context.sourceQueryKey) {
          queryClient.invalidateQueries({ queryKey: context.sourceQueryKey, exact: true });
        }
        if (context.destQueryKey) {
          queryClient.invalidateQueries({ queryKey: context.destQueryKey, exact: true });
        }
      }
    },
  });
}
