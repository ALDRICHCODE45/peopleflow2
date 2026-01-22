"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/core/shared/components/ShowToast";
import type { InteractionFormData, Interaction } from "../types";
import {
  addInteractionAction,
  getInteractionsByLeadAction,
} from "../../server/presentation/actions/interaction.actions";

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
