"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { cancelCommitmentAction } from "../../server/presentation/actions/cancelCommitment.action";
import { showToast } from "@/core/shared/components/ShowToast";
import { vacancyCommitmentsQueryKeys, vacancyQueryKeys } from "@core/shared/constants/query-keys";

interface CancelCommitmentData {
  commitmentId: string;
  vacancyId: string;
  reason?: string | null;
}

export function useCancelCommitment(): UseMutationResult<void, Error, CancelCommitmentData> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (data: CancelCommitmentData) => {
      const result = await cancelCommitmentAction({
        commitmentId: data.commitmentId,
        reason: data.reason,
      });
      if (result.error) {
        throw new Error(result.error);
      }
    },
    onSuccess: (_, variables) => {
      showToast({
        type: "success",
        title: "Compromiso cancelado",
        description: "El compromiso fue cancelado",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: vacancyCommitmentsQueryKeys.list(tenant.id, variables.vacancyId),
        });
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.all(tenant.id),
        });
      }
    },
    onError: () => {
      showToast({
        type: "error",
        title: "Error",
        description: "No se pudo cancelar el compromiso",
      });
    },
  });
}
