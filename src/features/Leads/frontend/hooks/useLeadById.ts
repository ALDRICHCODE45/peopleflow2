"use client";

import { useQuery } from "@tanstack/react-query";
import { getLeadByIdAction } from "../../server/presentation/actions/lead.actions";
import { leadsQueryKeys } from "@core/shared/constants/query-keys";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Hook that fetches complete lead details by ID.
 * Used internally by LeadDetailSheet to load full data when opened from Kanban (which uses minimal queries).
 */
export function useLeadById(leadId: string | null | undefined) {
  return useQuery({
    queryKey: leadId ? leadsQueryKeys.detail(leadId) : ["leads", "detail", "no-id"],
    queryFn: async () => {
      const result = await getLeadByIdAction(leadId!);
      if (result.error) throw new Error(result.error);
      return result.lead;
    },
    enabled: !!leadId,
    staleTime: STALE_TIME,
  });
}
