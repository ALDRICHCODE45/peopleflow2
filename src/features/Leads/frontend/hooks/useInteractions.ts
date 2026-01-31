"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/core/shared/components/ShowToast";
import type { InteractionFormData, Interaction } from "../types";
import {
  addInteractionAction,
  getInteractionsByLeadAction,
  getInteractionsByContactAction,
  updateInteractionAction,
  deleteInteractionAction,
} from "../../server/presentation/actions/interaction.actions";
import type { InteractionType } from "../types";

/**
 * Hook para obtener interacciones de un lead
 */
export function useInteractionsByLead(leadId: string | null) {
  return useQuery({
    queryKey: ["interactions", "by-lead", leadId],
    queryFn: async (): Promise<Interaction[]> => {
      if (!leadId) return [];
      const result = await getInteractionsByLeadAction(leadId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.interactions;
    },
    enabled: !!leadId,
    staleTime: 5 * 60 * 1000, // 5 minutes - reduces refetches when reopening sheet
  });
}

/**
 * Hook para obtener interacciones de un contacto específico
 */
export function useInteractionsByContact(contactId: string | null) {
  return useQuery({
    queryKey: ["interactions", "by-contact", contactId],
    queryFn: async (): Promise<Interaction[]> => {
      if (!contactId) return [];
      const result = await getInteractionsByContactAction(contactId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.interactions;
    },
    enabled: !!contactId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook para agregar una interacción
 */
export function useAddInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InteractionFormData) => {
      const result = await addInteractionAction(data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.interaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      showToast({
        type: "success",
        title: "Interacción agregada",
        description: "La interacción se ha registrado correctamente",
      });
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al agregar la interacción",
      });
    },
  });
}

/**
 * Hook para actualizar una interacción
 */
export function useUpdateInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      interactionId,
      data,
    }: {
      interactionId: string;
      data: {
        type?: InteractionType;
        subject?: string;
        content?: string | null;
        date?: string;
      };
    }) => {
      const result = await updateInteractionAction(interactionId, data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.interaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      showToast({
        type: "success",
        title: "Interacción actualizada",
        description: "La interacción se ha actualizado correctamente",
      });
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al actualizar la interacción",
      });
    },
  });
}

/**
 * Hook para eliminar una interacción
 */
export function useDeleteInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interactionId: string) => {
      const result = await deleteInteractionAction(interactionId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      showToast({
        type: "success",
        title: "Interacción eliminada",
        description: "La interacción se ha eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al eliminar la interacción",
      });
    },
  });
}
