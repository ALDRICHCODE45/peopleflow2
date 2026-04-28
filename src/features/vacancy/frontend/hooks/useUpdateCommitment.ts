"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { updateCommitmentAction } from "../../server/presentation/actions/updateCommitment.action";
import { showToast } from "@/core/shared/components/ShowToast";
import { vacancyCommitmentsQueryKeys, vacancyQueryKeys } from "@core/shared/constants/query-keys";

interface UpdateCommitmentData {
  commitmentId: string;
  vacancyId: string;
  description?: string;
  dueDate?: string;
}

export function useUpdateCommitment(): UseMutationResult<void, Error, UpdateCommitmentData> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (data: UpdateCommitmentData) => {
      const result = await updateCommitmentAction({
        commitmentId: data.commitmentId,
        description: data.description,
        dueDate: data.dueDate,
      });
      if (result.error) {
        throw new Error(result.error);
      }
    },
    onSuccess: (_, variables) => {
      showToast({
        type: "success",
        title: "Compromiso actualizado",
        description: "Los cambios fueron guardados exitosamente",
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
        description: "No se pudo actualizar el compromiso",
      });
    },
  });
}
