"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { useTenant } from "@features/tenants/frontend/context/TenantContext";
import { listInAppNotificationsAction } from "../../server/presentation/actions/listInAppNotifications.action";
import type { InAppNotificationDTO } from "../types/inAppNotification.types";

export const inAppNotificationQueryKeys = {
  list: (tenantId: string, unreadOnly: boolean) =>
    ["in-app-notifications", tenantId, { unreadOnly }] as const,
  unreadCount: (tenantId: string) =>
    ["in-app-notifications", "unread-count", tenantId] as const,
};

interface UseInAppNotificationsQueryInput {
  unreadOnly?: boolean;
  limit?: number;
  enabled?: boolean;
}

export function useInAppNotificationsQuery({
  unreadOnly = false,
  limit = 20,
  enabled = true,
}: UseInAppNotificationsQueryInput): UseQueryResult<
  { items: InAppNotificationDTO[]; nextCursor: string | null },
  Error
> {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: inAppNotificationQueryKeys.list(tenant?.id ?? "", unreadOnly),
    queryFn: async () => {
      const result = await listInAppNotificationsAction({ unreadOnly, limit });
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Error al listar notificaciones");
      }
      return result.data;
    },
    enabled: enabled && !!tenant?.id,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
