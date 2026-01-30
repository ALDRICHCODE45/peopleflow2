"use client";

import { useQuery } from "@tanstack/react-query";
import type { LeadStatusHistoryItem } from "../types";
import { getLeadStatusHistoryAction } from "../../server/presentation/actions/lead.actions";

/**
 * Hook para obtener el historial de cambios de estado de un lead
 */
export function useLeadStatusHistory(leadId: string | null) {
  return useQuery({
    queryKey: ["leadStatusHistory", "by-lead", leadId],
    queryFn: async (): Promise<LeadStatusHistoryItem[]> => {
      if (!leadId) return [];
      const result = await getLeadStatusHistoryAction(leadId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.history;
    },
    enabled: !!leadId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
