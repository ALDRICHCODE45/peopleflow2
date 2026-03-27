"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { invoiceQueryKeys } from "@core/shared/constants/query-keys";
import {
  uploadInvoiceComplementoAction,
  type UploadInvoiceComplementoResult,
} from "../../server/presentation/actions/uploadInvoiceComplemento.action";

interface UploadComplementoInput {
  formData: FormData;
  invoiceId: string;
}

/**
 * Hook para subir un complemento de pago (PDF) para una factura PPD
 */
export function useUploadInvoiceComplemento() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation<UploadInvoiceComplementoResult, Error, UploadComplementoInput>({
    mutationFn: async ({ formData, invoiceId }: UploadComplementoInput) => {
      const result = await uploadInvoiceComplementoAction(formData, invoiceId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (_data, variables) => {
      showToast({
        type: "success",
        title: "Complemento subido",
        description: "El complemento de pago se subi\u00f3 correctamente",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: invoiceQueryKeys.all(tenant.id),
        });
        queryClient.invalidateQueries({
          queryKey: invoiceQueryKeys.detail(tenant.id, variables.invoiceId),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al subir el complemento de pago",
      });
    },
  });
}
