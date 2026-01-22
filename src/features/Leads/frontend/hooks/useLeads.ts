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
      queryClient.invalidateQueries({ queryKey: ["leads"] });
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
      queryClient.invalidateQueries({ queryKey: ["leads"] });
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
      queryClient.invalidateQueries({ queryKey: ["leads"] });
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
 * Hook para actualizar el estado de un lead
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      showToast({
        type: "success",
        title: "Estado actualizado",
        description: "El estado del lead se ha actualizado correctamente",
      });
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al actualizar el estado",
      });
    },
  });
}
