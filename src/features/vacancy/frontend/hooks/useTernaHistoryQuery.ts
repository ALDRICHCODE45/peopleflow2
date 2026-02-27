"use client";

import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { getTernaHistoryAction } from "@features/vacancy/server/presentation/actions/getTernaHistory.action";

export function useTernaHistoryQuery(vacancyId: string | null) {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: ["vacancy", "terna-history", tenant?.id, vacancyId],
    queryFn: async () => {
      if (!vacancyId) return [];
      const result = await getTernaHistoryAction(vacancyId);
      if (result.error) throw new Error(result.error);
      return result.histories ?? [];
    },
    enabled: !!vacancyId && !!tenant?.id,
    staleTime: 30_000,
  });
}
