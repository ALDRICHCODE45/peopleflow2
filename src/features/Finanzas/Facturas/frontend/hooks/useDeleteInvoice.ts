"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { invoiceQueryKeys } from "@core/shared/constants/query-keys";
import { deleteInvoiceAction } from "../../server/presentation/actions/deleteInvoice.action";
import type { DeleteInvoiceActionResult } from "../../server/presentation/actions/deleteInvoice.action";

/**
 * Hook para eliminar una factura
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation<DeleteInvoiceActionResult, Error, string>({
    mutationFn: async (invoiceId: string) => {
      const result = await deleteInvoiceAction(invoiceId);
      if (!result.success) {
        throw new Error(result.error || "Error al eliminar la factura");
      }
      return result;
    },
    onSuccess: () => {
      showToast({
        type: "success",
        title: "Factura eliminada",
        description: "La factura fue eliminada exitosamente",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: invoiceQueryKeys.all(tenant.id),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo eliminar la factura",
      });
    },
  });
}
