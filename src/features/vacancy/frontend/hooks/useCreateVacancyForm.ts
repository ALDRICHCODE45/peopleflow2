"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useState, useCallback, useEffect } from "react";
import { addDays, isWeekend, nextMonday, parseISO, format } from "date-fns";
import { useCreateVacancy } from "./useCreateVacancy";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";
import { useClientsForSelect } from "./useClientsForSelect";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { addChecklistItemAction } from "../../server/presentation/actions/checklist.actions";
import type { VacancyServiceType } from "../types/vacancy.types";
import type { VacancyFormValues } from "../types/vacancy-form.types";

const SERVICE_TYPE_DAYS: Record<VacancyServiceType, number> = {
  SOURCING: 5,
  END_TO_END: 9,
};

function calculateTargetDeliveryDate(
  assignedAt: string,
  serviceType: VacancyServiceType | "",
): string {
  if (!assignedAt || serviceType === "") return "";
  const start = parseISO(assignedAt);
  let target = addDays(start, SERVICE_TYPE_DAYS[serviceType]);
  if (isWeekend(target)) {
    target = nextMonday(target);
  }
  return format(target, "yyyy-MM-dd");
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

  const today = format(new Date(), "yyyy-MM-dd");

  const defaultValues: VacancyFormValues = {
    position: "",
    recruiterId: "",
    clientId: "",
    serviceType: "SOURCING",
    currency: "",
    assignedAt: today,
    targetDeliveryDate: "",
    salaryType: "RANGE",
    salaryFixed: undefined,
    salaryMin: undefined,
    salaryMax: undefined,
    benefits: "",
    tools: "N/A",
    commissions: "N/A",
    modality: undefined,
    schedule: "",
    countryCode: "",
    regionCode: "",
    requiresPsychometry: false,
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const created = await createVacancyMutation.mutateAsync({
        position: value.position,
        recruiterId: value.recruiterId,
        clientId: value.clientId,
        serviceType: value.serviceType || undefined,
        currency: value.currency || undefined,
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
      // Auto-fill currency from client's default currency
      const selectedClient = clients.find((c) => c.id === clientId);
      if (selectedClient?.currency) {
        form.setFieldValue(
          "currency",
          selectedClient.currency as VacancyFormValues["currency"],
        );
      }
    },
    [form, clients],
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

/**
 * Return type for useCreateVacancyForm.
 * Extracted via ReturnType to avoid manually specifying TanStack Form's 12 generics.
 */
export type UseCreateVacancyFormReturn = ReturnType<typeof useCreateVacancyForm>;
