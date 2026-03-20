"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useCallback, useEffect } from "react";
import { useUpdateVacancy } from "./useUpdateVacancy";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";
import { useClientsForSelect } from "./useClientsForSelect";
import { useModalState } from "@/core/shared/hooks/useModalState";
import type {
  VacancyServiceType,
  VacancyModality,
  VacancySalaryType,
  VacancyDTO,
} from "../types/vacancy.types";

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
  if (!assignedAt || !serviceType) return "";
  const date = new Date(assignedAt);
  date.setDate(date.getDate() + SERVICE_TYPE_DAYS[serviceType as VacancyServiceType]);
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

  const form = useForm({
    defaultValues: {
      position: vacancy.position,
      recruiterId: vacancy.recruiterId,
      clientId: vacancy.clientId,
      serviceType: (vacancy.serviceType ?? "") as VacancyServiceType | "",
      assignedAt: vacancy.assignedAt,
      targetDeliveryDate: vacancy.targetDeliveryDate ?? "",
      salaryType: (vacancy.salaryType ?? "RANGE") as VacancySalaryType,
      salaryFixed: (vacancy.salaryFixed ?? undefined) as number | undefined,
      salaryMin: (vacancy.salaryMin ?? undefined) as number | undefined,
      salaryMax: (vacancy.salaryMax ?? undefined) as number | undefined,
      benefits: vacancy.benefits ?? "",
      tools: vacancy.tools ?? "",
      commissions: vacancy.commissions ?? "",
      modality: (vacancy.modality ?? undefined) as VacancyModality | undefined,
      schedule: vacancy.schedule ?? "",
      countryCode: vacancy.countryCode ?? "",
      regionCode: vacancy.regionCode ?? "",
      requiresPsychometry: vacancy.requiresPsychometry,
    },
    onSubmit: async ({ value }) => {
      await updateVacancyMutation.mutateAsync({
        id: vacancy.id,
        data: {
          ...value,
          serviceType: value.serviceType as VacancyServiceType | undefined,
          salaryType: value.salaryType,
          salaryFixed: value.salaryType === "FIXED" ? (value.salaryFixed ?? null) : null,
          salaryMin: value.salaryType === "RANGE" ? (value.salaryMin ?? null) : null,
          salaryMax: value.salaryType === "RANGE" ? (value.salaryMax ?? null) : null,
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
