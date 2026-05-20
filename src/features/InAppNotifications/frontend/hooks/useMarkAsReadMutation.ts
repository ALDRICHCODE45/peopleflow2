"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { useTenant } from "@features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { markInAppNotificationAsReadAction } from "../../server/presentation/actions/markInAppNotificationAsRead.action";
import { inAppNotificationQueryKeys } from "./useInAppNotificationsQuery";

interface MarkAsReadInput {
  id: string;
}

export function useMarkAsReadMutation(): UseMutationResult<void, Error, MarkAsReadInput> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (input: MarkAsReadInput) => {
      const result = await markInAppNotificationAsReadAction(input);
      if (result.error) {
        throw new Error(result.error);
      }
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
        description: "No se pudo marcar la notificación como leída",
      });
    },
  });
}
