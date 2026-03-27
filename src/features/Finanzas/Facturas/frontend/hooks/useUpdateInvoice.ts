"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { invoiceQueryKeys } from "@core/shared/constants/query-keys";
import {
  updateInvoiceAction,
  type UpdateInvoiceActionInput,
} from "../../server/presentation/actions/updateInvoice.action";
import type { InvoiceDTO } from "../types/invoice.types";

/**
 * Hook para actualizar una factura existente
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation<InvoiceDTO | undefined, Error, UpdateInvoiceActionInput>({
    mutationFn: async (data: UpdateInvoiceActionInput) => {
      const result = await updateInvoiceAction(data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_data, variables) => {
      showToast({
        type: "success",
        title: "Factura actualizada",
        description: "La factura se actualiz\u00f3 correctamente",
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
        description: error.message || "Error al actualizar la factura",
      });
    },
  });
}
