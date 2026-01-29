"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getContactsByLeadAction } from "../../server/presentation/actions/contact.actions";
import { getInteractionsByLeadAction } from "../../server/presentation/actions/interaction.actions";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes - matches the staleTime in useContactsByLead and useInteractionsByLead

/**
 * Hook that provides a prefetch function for lead details (contacts and interactions).
 * Call the returned function on hover/mouseenter to preload data before the user clicks.
 */
export function usePrefetchLeadDetails() {
  const queryClient = useQueryClient();

  return useCallback(
    (leadId: string) => {
      // Prefetch contacts for this lead
      queryClient.prefetchQuery({
        queryKey: ["contacts", "by-lead", leadId],
        queryFn: async () => {
          const result = await getContactsByLeadAction(leadId);
          if (result.error) throw new Error(result.error);
          return result.contacts;
        },
        staleTime: STALE_TIME,
      });

      // Prefetch interactions for this lead
      queryClient.prefetchQuery({
        queryKey: ["interactions", "by-lead", leadId],
        queryFn: async () => {
          const result = await getInteractionsByLeadAction(leadId);
          if (result.error) throw new Error(result.error);
          return result.interactions;
        },
        staleTime: STALE_TIME,
      });
    },
    [queryClient]
  );
}
