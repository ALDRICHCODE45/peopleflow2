"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { invoiceQueryKeys } from "@core/shared/constants/query-keys";
import {
  createInvoiceAction,
  type CreateInvoiceActionInput,
} from "../../server/presentation/actions/createInvoice.action";
import type { InvoiceDTO } from "../types/invoice.types";

/**
 * Hook para crear una nueva factura
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation<InvoiceDTO | undefined, Error, CreateInvoiceActionInput>({
    mutationFn: async (data: CreateInvoiceActionInput) => {
      const result = await createInvoiceAction(data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      showToast({
        type: "success",
        title: "Factura creada",
        description: "La factura se cre\u00f3 correctamente",
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
        description: error.message || "Error al crear la factura",
      });
    },
  });
}
