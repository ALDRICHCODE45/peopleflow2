"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { invoiceQueryKeys } from "@core/shared/constants/query-keys";
import {
  updateInvoiceStatusAction,
  type UpdateInvoiceStatusActionInput,
} from "../../server/presentation/actions/updateInvoiceStatus.action";
import type { InvoiceDTO } from "../types/invoice.types";

/**
 * Hook para actualizar el estado de una factura (POR_COBRAR \u2192 PAGADA)
 */
export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation<InvoiceDTO | undefined, Error, UpdateInvoiceStatusActionInput>({
    mutationFn: async (data: UpdateInvoiceStatusActionInput) => {
      const result = await updateInvoiceStatusAction(data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_data, variables) => {
      showToast({
        type: "success",
        title: "Estado actualizado",
        description: "El estado de la factura se actualiz\u00f3 correctamente",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: invoiceQueryKeys.all(tenant.id),
        });
        queryClient.invalidateQueries({
          queryKey: invoiceQueryKeys.detail(tenant.id, variables.id),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al actualizar el estado de la factura",
      });
    },
  });
}
