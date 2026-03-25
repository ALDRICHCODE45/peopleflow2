"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { createClientManualAction } from "../../server/presentation/actions/createClientManual.action";
import { clientsQueryKeys } from "./useClient";

interface CreateClientInput {
  companyName: string;
  generadorId: string;
}

/**
 * Hook para crear un cliente manualmente (sin conversión de lead)
 */
export function useCreateClient() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (data: CreateClientInput) => {
      const result = await createClientManualAction(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      showToast({
        type: "success",
        title: "Cliente creado",
        description: "El cliente se creó correctamente",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: clientsQueryKeys.all(tenant.id),
        });
        // Invalidar también las queries paginadas
        queryClient.invalidateQueries({
          queryKey: ["clients", "paginated", tenant.id],
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al crear el cliente",
      });
    },
  });
}
