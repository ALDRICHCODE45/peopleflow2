"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { completeCommitmentAction } from "../../server/presentation/actions/completeCommitment.action";
import { showToast } from "@/core/shared/components/ShowToast";
import { vacancyCommitmentsQueryKeys, vacancyQueryKeys } from "@core/shared/constants/query-keys";

interface CompleteCommitmentData {
  commitmentId: string;
  vacancyId: string;
  note?: string | null;
}

export function useCompleteCommitment(): UseMutationResult<void, Error, CompleteCommitmentData> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (data: CompleteCommitmentData) => {
      const result = await completeCommitmentAction({
        commitmentId: data.commitmentId,
        note: data.note,
      });
      if (result.error) {
        throw new Error(result.error);
      }
    },
    onSuccess: (_, variables) => {
      showToast({
        type: "success",
        title: "Compromiso completado",
        description: "El compromiso fue completado exitosamente",
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
        description: "No se pudo completar el compromiso",
      });
    },
  });
}
