"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useCallback, useEffect } from "react";
import { useUpdateVacancy } from "./useUpdateVacancy";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";
import { useClientsForSelect } from "./useClientsForSelect";
import { useModalState } from "@/core/shared/hooks/useModalState";
import type { VacancyServiceType, VacancyDTO } from "../types/vacancy.types";
import type { VacancyFormValues } from "../types/vacancy-form.types";

const SERVICE_TYPE_DAYS: Record<VacancyServiceType, number> = {
  SOURCING: 5,
  END_TO_END: 9,
};

function adjustForWeekend(date: Date): Date {
  const day = date.getDay();
  if (day === 6) date.setDate(date.getDate() + 2); // Saturday -> Monday
  if (day === 0) date.setDate(date.getDate() + 1); // Sunday -> Monday
  return date;
}

function calculateTargetDeliveryDate(
  assignedAt: string,
  serviceType: VacancyServiceType | "",
): string {
  if (!assignedAt || serviceType === "") return "";
  const date = new Date(assignedAt);
  date.setDate(date.getDate() + SERVICE_TYPE_DAYS[serviceType]);
  adjustForWeekend(date);
  return date.toISOString().split("T")[0];
}

export function useEditVacancyForm({
  onClose,
  vacancy,
  canEditTargetDeliveryDate,
}: {
  onClose: () => void;
  vacancy: VacancyDTO;
  canEditTargetDeliveryDate: boolean;
}) {
  const updateVacancyMutation = useUpdateVacancy();
  const { data: users = [] } = useTenantUsersQuery();
  const { data: clients = [] } = useClientsForSelect();

  const detailsModal = useModalState();

  const defaultValues: VacancyFormValues = {
    position: vacancy.position,
    recruiterId: vacancy.recruiterId,
    clientId: vacancy.clientId,
    serviceType: vacancy.serviceType ?? "",
    assignedAt: vacancy.assignedAt,
    targetDeliveryDate: vacancy.targetDeliveryDate ?? "",
    salaryType: vacancy.salaryType ?? "RANGE",
    salaryFixed: vacancy.salaryFixed ?? undefined,
    salaryMin: vacancy.salaryMin ?? undefined,
    salaryMax: vacancy.salaryMax ?? undefined,
    benefits: vacancy.benefits ?? "",
    tools: vacancy.tools ?? "",
    commissions: vacancy.commissions ?? "",
    modality: vacancy.modality ?? undefined,
    schedule: vacancy.schedule ?? "",
    countryCode: vacancy.countryCode ?? "",
    regionCode: vacancy.regionCode ?? "",
    requiresPsychometry: vacancy.requiresPsychometry,
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await updateVacancyMutation.mutateAsync({
        id: vacancy.id,
        data: {
          position: value.position,
          recruiterId: value.recruiterId,
          clientId: value.clientId,
          serviceType: value.serviceType || undefined,
          assignedAt: value.assignedAt || undefined,
          salaryType: value.salaryType,
          salaryFixed:
            value.salaryType === "FIXED" ? (value.salaryFixed ?? null) : null,
          salaryMin:
            value.salaryType === "RANGE" ? (value.salaryMin ?? null) : null,
          salaryMax:
            value.salaryType === "RANGE" ? (value.salaryMax ?? null) : null,
          benefits: value.benefits || undefined,
          tools: value.tools || undefined,
          commissions: value.commissions || undefined,
          modality: value.modality,
          schedule: value.schedule || undefined,
          countryCode: value.countryCode || undefined,
          regionCode: value.regionCode || undefined,
          requiresPsychometry: value.requiresPsychometry,
          targetDeliveryDate: value.targetDeliveryDate || undefined,
        },
      });
      onClose();
    },
  });

  // Auto-calculate targetDeliveryDate when serviceType or assignedAt change
  const serviceType = useStore(form.store, (s) => s.values.serviceType);
  const assignedAt = useStore(form.store, (s) => s.values.assignedAt);

  useEffect(() => {
    const calculated = calculateTargetDeliveryDate(assignedAt, serviceType);
    if (calculated) {
      form.setFieldValue("targetDeliveryDate", calculated);
    }
  }, [serviceType, assignedAt, form]);

  const handleClientChange = useCallback(
    (clientId: string) => {
      form.setFieldValue("clientId", clientId);
    },
    [form],
  );

  return {
    form,
    users,
    clients,
    detailsModal,
    canEditTargetDeliveryDate,
    isSubmitting: updateVacancyMutation.isPending,
    handleClientChange,
  };
}

/**
 * Return type for useEditVacancyForm.
 * Extracted via ReturnType to avoid manually specifying TanStack Form's 12 generics.
 */
export type UseEditVacancyFormReturn = ReturnType<typeof useEditVacancyForm>;
