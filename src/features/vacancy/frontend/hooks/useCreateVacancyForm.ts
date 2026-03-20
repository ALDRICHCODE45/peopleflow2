"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useState, useCallback, useEffect } from "react";
import { useCreateVacancy } from "./useCreateVacancy";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";
import { useClientsForSelect } from "./useClientsForSelect";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { addChecklistItemAction } from "../../server/presentation/actions/checklist.actions";
import type {
  VacancyServiceType,
  VacancyModality,
  VacancySalaryType,
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
  date.setDate(
    date.getDate() + SERVICE_TYPE_DAYS[serviceType as VacancyServiceType],
  );
  adjustForWeekend(date);
  return date.toISOString().split("T")[0];
}

export function useCreateVacancyForm({
  onClose,
  canEditTargetDeliveryDate,
}: {
  onClose: () => void;
  canEditTargetDeliveryDate: boolean;
}) {
  const createVacancyMutation = useCreateVacancy();
  const { data: users = [] } = useTenantUsersQuery();
  const { data: clients = [] } = useClientsForSelect();

  const [checklist, setChecklist] = useState<string[]>([]);
  const [sendNotification, setSendNotification] = useState(false);
  const detailsModal = useModalState();

  const today = new Date().toISOString().split("T")[0];

  const form = useForm({
    defaultValues: {
      position: "",
      recruiterId: "",
      clientId: "",
      serviceType: "SOURCING" as VacancyServiceType | "",
      assignedAt: today,
      targetDeliveryDate: "",
      salaryType: "RANGE" as VacancySalaryType,
      salaryFixed: undefined as number | undefined,
      salaryMin: undefined as number | undefined,
      salaryMax: undefined as number | undefined,
      benefits: "",
      tools: "",
      commissions: "",
      modality: undefined as VacancyModality | undefined,
      schedule: "",
      countryCode: "",
      regionCode: "",
      requiresPsychometry: false,
    },
    onSubmit: async ({ value }) => {
      const created = await createVacancyMutation.mutateAsync({
        position: value.position,
        recruiterId: value.recruiterId,
        clientId: value.clientId,
        serviceType: value.serviceType as VacancyServiceType | undefined,
        assignedAt: value.assignedAt || undefined,
        salaryType: value.salaryType,
        salaryFixed: value.salaryType === "FIXED" ? (value.salaryFixed ?? null) : null,
        salaryMin: value.salaryType === "RANGE" ? (value.salaryMin ?? null) : null,
        salaryMax: value.salaryType === "RANGE" ? (value.salaryMax ?? null) : null,
        benefits: value.benefits || undefined,
        tools: value.tools || undefined,
        commissions: value.commissions || undefined,
        modality: value.modality,
        schedule: value.schedule || undefined,
        countryCode: value.countryCode || undefined,
        regionCode: value.regionCode || undefined,
        requiresPsychometry: value.requiresPsychometry,
        targetDeliveryDate: value.targetDeliveryDate || undefined,
        sendNotification,
      });

      // Save checklist items after vacancy creation
      if (created?.id && checklist.length > 0) {
        for (let i = 0; i < checklist.length; i++) {
          if (checklist[i].trim()) {
            await addChecklistItemAction(created.id, checklist[i].trim(), i);
          }
        }
      }

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

  const addChecklistItem = useCallback(() => {
    setChecklist((prev) => [...prev, ""]);
  }, []);

  const updateChecklistItem = useCallback((index: number, value: string) => {
    setChecklist((prev) => prev.map((item, i) => (i === index ? value : item)));
  }, []);

  const removeChecklistItem = useCallback((index: number) => {
    setChecklist((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    form,
    users,
    clients,
    checklist,
    sendNotification,
    setSendNotification,
    detailsModal,
    canEditTargetDeliveryDate,
    isSubmitting: createVacancyMutation.isPending,
    handleClientChange,
    addChecklistItem,
    updateChecklistItem,
    removeChecklistItem,
  };
}
