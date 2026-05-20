"use client";

import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { useTenant } from "@features/tenants/frontend/context/TenantContext";
import { getUnreadInAppNotificationCountAction } from "../../server/presentation/actions/getUnreadInAppNotificationCount.action";
import { inAppNotificationQueryKeys } from "./useInAppNotificationsQuery";

export function useUnreadCountQuery(): UseQueryResult<number, Error> {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: inAppNotificationQueryKeys.unreadCount(tenant?.id ?? ""),
    queryFn: async () => {
      const result = await getUnreadInAppNotificationCountAction();
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Error al obtener conteo");
      }
      return result.data.count;
    },
    enabled: !!tenant?.id,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
