"use client";

import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ClientOption } from "../../server/presentation/actions/getClientsForSelect.action";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { getClientsForSelectAction } from "../../server/presentation/actions/getClientsForSelect.action";

export function useClientsForSelect(): UseQueryResult<ClientOption[], Error> {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: ["clients", "for-select", tenant?.id],
    queryFn: async () => {
      const result = await getClientsForSelectAction();
      if (result.error) throw new Error(result.error);
      return result.clients;
    },
    enabled: !!tenant?.id,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
