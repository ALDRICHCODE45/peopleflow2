"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { createCommitmentAction } from "../../server/presentation/actions/createCommitment.action";
import { showToast } from "@/core/shared/components/ShowToast";
import { vacancyCommitmentsQueryKeys, vacancyQueryKeys } from "@core/shared/constants/query-keys";

interface CreateCommitmentData {
  vacancyId: string;
  description: string;
  dueDate: string;
}

export function useCreateCommitment(): UseMutationResult<void, Error, CreateCommitmentData> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (data: CreateCommitmentData) => {
      const result = await createCommitmentAction(data);
      if (result.error) {
        throw new Error(result.error);
      }
    },
    onSuccess: (_, variables) => {
      showToast({
        type: "success",
        title: "Compromiso creado",
        description: "El compromiso fue creado exitosamente",
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
        description: "No se pudo crear el compromiso",
      });
    },
  });
}
