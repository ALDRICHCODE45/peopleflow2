"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { vacancyQueryKeys } from "@core/shared/constants/query-keys";
import { checkWarrantyEligibilityAction } from "@features/vacancy/server/presentation/actions/checkWarrantyEligibility.action";
import { createWarrantyVacancyAction } from "@features/vacancy/server/presentation/actions/createWarrantyVacancy.action";
import type {
  CheckWarrantyEligibilityResult,
  CreateWarrantyVacancyInput,
  CreateWarrantyVacancyResult,
  VacancyDTO,
} from "../types/vacancy.types";

// ── Check Warranty Eligibility ─────────────────────────────────────────────

export function useCheckWarrantyEligibility(vacancyId: string | null) {
  const { tenant } = useTenant();

  return useQuery<CheckWarrantyEligibilityResult>({
    queryKey: ["warranty", "eligibility", tenant?.id, vacancyId],
    queryFn: async () => {
      if (!vacancyId) throw new Error("vacancyId es requerido");
      const result = await checkWarrantyEligibilityAction(vacancyId);
      if (result.error) throw new Error(result.error);
      return result;
    },
    enabled: !!tenant?.id && !!vacancyId,
    staleTime: 30_000,
  });
}

// ── Create Warranty Vacancy ────────────────────────────────────────────────

export function useCreateWarrantyVacancy() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation<VacancyDTO | undefined, Error, CreateWarrantyVacancyInput>({
    mutationFn: async (data: CreateWarrantyVacancyInput) => {
      const result: CreateWarrantyVacancyResult =
        await createWarrantyVacancyAction(data);
      if (result.error) throw new Error(result.error);
      return result.vacancy;
    },
    onSuccess: () => {
      showToast({
        type: "success",
        title: "Garantía aplicada",
        description:
          "La vacante de garantía fue creada exitosamente",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.all(tenant.id),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error al aplicar garantía",
        description: error.message ?? "No se pudo crear la vacante de garantía",
      });
    },
  });
}
