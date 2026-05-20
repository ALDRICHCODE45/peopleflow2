"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { useTenant } from "@features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { markAllInAppNotificationsAsReadAction } from "../../server/presentation/actions/markAllInAppNotificationsAsRead.action";
import { inAppNotificationQueryKeys } from "./useInAppNotificationsQuery";

export function useMarkAllAsReadMutation(): UseMutationResult<number, Error, void> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async () => {
      const result = await markAllInAppNotificationsAsReadAction();
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Error al marcar notificaciones");
      }
      return result.data.count;
    },
    onSuccess: () => {
      if (!tenant?.id) return;
      queryClient.invalidateQueries({
        queryKey: inAppNotificationQueryKeys.unreadCount(tenant.id),
      });
      queryClient.invalidateQueries({
        queryKey: ["in-app-notifications", tenant.id],
      });
    },
    onError: () => {
      showToast({
        type: "error",
        title: "Error",
        description: "No se pudieron actualizar las notificaciones",
      });
    },
  });
}
