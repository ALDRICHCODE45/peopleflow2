"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/core/shared/components/ShowToast";
import type { LeadStatus, LeadFormData } from "../types";
import {
  createLeadAction,
  updateLeadAction,
  deleteLeadAction,
  updateLeadStatusAction,
} from "../../server/presentation/actions/lead.actions";

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

    // Optimistic update for instant UI feedback
    onMutate: async ({ leadId, newStatus }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["leads"] });

      // Snapshot previous data for rollback
      const previousPaginatedData = queryClient.getQueriesData({
        queryKey: ["leads", "paginated"],
      });
      const previousInfiniteData = queryClient.getQueriesData({
        queryKey: ["leads", "infinite"],
      });

      // Optimistically update paginated queries
      queryClient.setQueriesData(
        { queryKey: ["leads", "paginated"] },
        (old: { data?: { id: string; status: LeadStatus }[] } | undefined) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((lead) =>
              lead.id === leadId ? { ...lead, status: newStatus } : lead
            ),
          };
        }
      );

      // Optimistically update infinite queries
      queryClient.setQueriesData(
        { queryKey: ["leads", "infinite"] },
        (
          old:
            | {
                pages?: Array<{
                  data?: { id: string; status: LeadStatus }[];
                }>;
              }
            | undefined
        ) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data?.map((lead) =>
                lead.id === leadId ? { ...lead, status: newStatus } : lead
              ),
            })),
          };
        }
      );

      return { previousPaginatedData, previousInfiniteData };
    },

    // Rollback on error
    onError: (error: Error, _variables, context) => {
      // Restore previous paginated data
      if (context?.previousPaginatedData) {
        context.previousPaginatedData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      // Restore previous infinite data
      if (context?.previousInfiniteData) {
        context.previousInfiniteData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
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

    // Always refetch after error or success to ensure data consistency
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["leads"],
        refetchType: "active",
      });
    },
  });
}
