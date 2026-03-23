"use client";

import { useForm, useStore } from "@tanstack/react-form";
import type { CommercialTermsFormData } from "@features/Finanzas/Clientes/frontend/types/client.types";

const DEFAULT_VALUES: CommercialTermsFormData = {
  currency: "MXN",
  initialPositions: 1,
  paymentScheme: "SUCCESS_100",
  advanceType: null,
  advanceValue: null,
  feeType: "PERCENTAGE",
  feeValue: 0,
  creditDays: 30,
  cancellationFee: null,
  warrantyMonths: 3,
};

interface UseCommercialTermsFormProps {
  onSubmit: (data: CommercialTermsFormData) => void;
}

export function useCommercialTermsForm({
  onSubmit,
}: UseCommercialTermsFormProps) {
  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    onSubmit: async ({ value }) => {
      const isAdvanceScheme = value.paymentScheme === "ADVANCE";

      const cleaned: CommercialTermsFormData = {
        ...value,
        advanceType: isAdvanceScheme ? value.advanceType : null,
        advanceValue: isAdvanceScheme ? value.advanceValue : null,
      };

      onSubmit(cleaned);
    },
  });

  const paymentScheme = useStore(form.store, (s) => s.values.paymentScheme);
  const advanceType = useStore(form.store, (s) => s.values.advanceType);
  const feeType = useStore(form.store, (s) => s.values.feeType);

  const isAdvance = paymentScheme === "ADVANCE";

  return {
    form,
    isAdvance,
    feeType,
    advanceType,
    paymentScheme,
  };
}

export type UseCommercialTermsFormReturn = ReturnType<
  typeof useCommercialTermsForm
>;
