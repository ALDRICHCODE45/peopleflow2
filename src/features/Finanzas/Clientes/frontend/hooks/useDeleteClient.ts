"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { clientsQueryKeys } from "@core/shared/constants/query-keys";
import { deleteClientAction } from "../../server/presentation/actions/deleteClient.action";
import type { DeleteClientActionResult } from "../types/client.types";

/**
 * Hook para eliminar un cliente
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation<DeleteClientActionResult, Error, string>({
    mutationFn: async (clientId: string) => {
      const result = await deleteClientAction(clientId);
      if (!result.success) {
        throw new Error(result.error || "Error al eliminar el cliente");
      }
      return result;
    },
    onSuccess: () => {
      showToast({
        type: "success",
        title: "Cliente eliminado",
        description: "El cliente fue eliminado exitosamente",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: clientsQueryKeys.paginated(tenant.id),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo eliminar el cliente",
      });
    },
  });
}
