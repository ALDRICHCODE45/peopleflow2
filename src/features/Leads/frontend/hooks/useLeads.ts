"use client";

import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";
import { showToast } from "@/core/shared/components/ShowToast";
import type { LeadStatus, LeadFormData, Lead } from "../types";
import {
  createLeadAction,
  updateLeadAction,
  deleteLeadAction,
  updateLeadStatusAction,
  reasignLeadAction,
  bulkDeleteLeadsAction,
  bulkReasignLeadsAction,
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
    onSuccess: (newLead) => {
      // Invalidate only the specific status column and paginated view
      // This reduces refetches from 8+ queries to 1-2
      if (newLead?.status) {
        queryClient.invalidateQueries({
          queryKey: ["leads", "infinite"],
          predicate: (query) => {
            const key = query.queryKey as string[];
            return key[3] === newLead.status;
          },
          refetchType: "active",
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["leads", "paginated"],
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
    onSuccess: (updatedLead) => {
      // Invalidate only the specific status column and paginated view
      if (updatedLead?.status) {
        queryClient.invalidateQueries({
          queryKey: ["leads", "infinite"],
          predicate: (query) => {
            const key = query.queryKey as string[];
            return key[3] === updatedLead.status;
          },
          refetchType: "active",
        });
      }
      // Invalidate the specific lead detail query
      if (updatedLead?.id) {
        queryClient.invalidateQueries({
          queryKey: ["leads", "detail", updatedLead.id],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["leads", "paginated"],
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
      // For delete, we need to invalidate all infinite queries since we don't know the status
      // but we use refetchType: "active" to only refetch visible ones
      queryClient.invalidateQueries({
        queryKey: ["leads", "infinite"],
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["leads", "paginated"],
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
 * Hook para reasignar un lead
 */
export function useReasignLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      newUserId,
    }: {
      leadId: string;
      newUserId: string;
    }) => {
      const result = await reasignLeadAction(leadId, newUserId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.lead;
    },
    onSuccess: (reasignedLead) => {
      // Only invalidate the specific status column and detail query
      if (reasignedLead?.status) {
        queryClient.invalidateQueries({
          queryKey: ["leads", "infinite"],
          predicate: (query) => {
            const key = query.queryKey as string[];
            return key[3] === reasignedLead.status;
          },
          refetchType: "active",
        });
      }
      if (reasignedLead?.id) {
        queryClient.invalidateQueries({
          queryKey: ["leads", "detail", reasignedLead.id],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["leads", "paginated"],
        refetchType: "active",
      });
      showToast({
        type: "success",
        title: "Lead Reasignado",
        description: "El lead se ha reasignado correctamente",
      });
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al reasignar el contacto",
      });
    },
  });
}

/**
 * Hook para eliminar múltiples leads
 */
export function useBulkDeleteLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadIds: string[]) => {
      const result = await bulkDeleteLeadsAction(leadIds);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["leads", "infinite"],
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["leads", "paginated"],
        refetchType: "active",
      });
      showToast({
        type: "success",
        title: "Leads eliminados",
        description: `Se eliminaron ${result.deletedCount} lead${result.deletedCount !== 1 ? "s" : ""} correctamente`,
      });
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al eliminar los leads",
      });
    },
  });
}

/**
 * Hook para reasignar múltiples leads
 */
export function useBulkReasignLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadIds,
      newUserId,
    }: {
      leadIds: string[];
      newUserId: string;
    }) => {
      const result = await bulkReasignLeadsAction(leadIds, newUserId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["leads", "infinite"],
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["leads", "paginated"],
        refetchType: "active",
      });
      showToast({
        type: "success",
        title: "Leads reasignados",
        description: `Se reasignaron ${result.reasignedCount} lead${result.reasignedCount !== 1 ? "s" : ""} correctamente`,
      });
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al reasignar los leads",
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
        // Lanzar error especial para datos incompletos
        if (result.error === "INCOMPLETE_DATA") {
          const error = new Error("INCOMPLETE_DATA") as Error & {
            missingFields: string[];
          };
          error.missingFields = result.missingFields || [];
          throw error;
        }
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
      if (
        !sourceStatus ||
        !leadToMove ||
        !sourceQueryKey ||
        sourceStatus === newStatus
      ) {
        return undefined;
      }

      // 2. Build destination query key (same structure, different status)
      // Query key structure: ["leads", "infinite", tenantId, status, filters]
      const destQueryKey = [
        sourceQueryKey[0], // "leads"
        sourceQueryKey[1], // "infinite"
        sourceQueryKey[2], // tenantId
        newStatus, // new status
        sourceQueryKey[4], // filters
      ] as QueryKey;

      // 3. Cancel only affected queries to avoid race conditions
      await queryClient.cancelQueries({
        queryKey: sourceQueryKey,
        exact: true,
      });
      await queryClient.cancelQueries({ queryKey: destQueryKey, exact: true });

      // 4. Snapshot previous data for rollback
      const previousSourceData =
        queryClient.getQueryData<LeadsInfiniteData>(sourceQueryKey);
      const previousDestData =
        queryClient.getQueryData<LeadsInfiniteData>(destQueryKey);

      // 5. Remove lead from source column
      queryClient.setQueryData<LeadsInfiniteData>(sourceQueryKey, (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page, idx) => ({
            ...page,
            data: page.data?.filter((l) => l.id !== leadId) ?? [],
            pagination:
              idx === 0
                ? {
                    ...page.pagination,
                    totalCount: Math.max(0, page.pagination.totalCount - 1),
                  }
                : page.pagination,
          })),
        };
      });

      // 6. Add lead to destination column (only if query exists and has data)
      const destQueryExists =
        previousDestData?.pages && previousDestData.pages.length > 0;

      if (destQueryExists) {
        // Safe to apply optimistic update
        queryClient.setQueryData<LeadsInfiniteData>(destQueryKey, (old) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page, idx) => ({
              ...page,
              data: idx === 0 ? [leadToMove!, ...(page.data ?? [])] : page.data,
              pagination:
                idx === 0
                  ? {
                      ...page.pagination,
                      totalCount: page.pagination.totalCount + 1,
                    }
                  : page.pagination,
            })),
          };
        });
      }
      // If dest query doesn't exist, don't create fake structure - will invalidate in onSettled

      return {
        previousSourceData,
        previousDestData,
        sourceQueryKey,
        destQueryKey,
        destQueryExists,
      };
    },

    // Rollback on error - restore previous data from both columns
    onError: (error: Error, _variables, context) => {
      // Rollback source
      if (context?.sourceQueryKey && context?.previousSourceData) {
        queryClient.setQueryData(
          context.sourceQueryKey,
          context.previousSourceData,
        );
      }
      // Rollback destination only if there was previous data
      if (context?.destQueryKey && context?.previousDestData) {
        queryClient.setQueryData(
          context.destQueryKey,
          context.previousDestData,
        );
      }

      // No mostrar toast para datos incompletos - se maneja con el dialog
      if (error.message === "INCOMPLETE_DATA") {
        return;
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

    // Always invalidate both columns using partial query keys
    // This ensures React Query finds the queries regardless of filter object references
    onSettled: (_data, _error, variables, context) => {
      if (!context?.sourceQueryKey) return;

      const tenantId = context.sourceQueryKey[2];
      if (!tenantId) return;

      // Extract the source status from the query key
      const sourceStatus = context.sourceQueryKey[3];
      const { newStatus } = variables;

      // Invalidate source column using partial query key (without filters object)
      // exact: false allows matching regardless of the filter object reference
      if (sourceStatus) {
        queryClient.invalidateQueries({
          queryKey: ["leads", "infinite", tenantId, sourceStatus],
          exact: false,
        });
      }

      // Invalidate destination column using partial query key
      queryClient.invalidateQueries({
        queryKey: ["leads", "infinite", tenantId, newStatus],
        exact: false,
      });

      // Invalidate paginated view (table) so it reflects status changes
      queryClient.invalidateQueries({
        queryKey: ["leads", "paginated"],
        refetchType: "active",
      });

      // Invalidate the specific lead's detail query to ensure fresh data
      // This is critical for the incomplete data flow where the detail might be cached
      const { leadId } = variables;
      queryClient.invalidateQueries({
        queryKey: ["leads", "detail", leadId],
      });
    },
  });
}
