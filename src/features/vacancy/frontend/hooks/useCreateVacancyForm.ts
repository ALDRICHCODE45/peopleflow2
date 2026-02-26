"use client";

import { useForm } from "@tanstack/react-form";
import { useState, useCallback } from "react";
import { useCreateVacancy } from "./useCreateVacancy";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";
import { useClientsForSelect } from "./useClientsForSelect";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { checkClientSaleTypeAction } from "../../server/presentation/actions/checkClientSaleType.action";
import { addChecklistItemAction } from "../../server/presentation/actions/checklist.actions";
import type { VacancySaleType, VacancyModality } from "../types/vacancy.types";

export function useCreateVacancyForm({ onClose }: { onClose: () => void }) {
  const createVacancyMutation = useCreateVacancy();
  const { data: users = [] } = useTenantUsersQuery();
  const { data: clients = [] } = useClientsForSelect();

  const [saleType, setSaleType] = useState<VacancySaleType>("NUEVA");
  const [checklist, setChecklist] = useState<string[]>([]);
  const [sendNotification, setSendNotification] = useState(false);
  const detailsModal = useModalState();

  const today = new Date();
  const defaultDelivery = new Date(today);
  defaultDelivery.setDate(today.getDate() + 7);

  const form = useForm({
    defaultValues: {
      position: "",
      recruiterId: "",
      clientId: "",
      assignedAt: today.toISOString().split("T")[0],
      targetDeliveryDate: defaultDelivery.toISOString().split("T")[0],
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
      const vacancy = await createVacancyMutation.mutateAsync({
        position: value.position,
        recruiterId: value.recruiterId,
        clientId: value.clientId,
        salaryMin: value.salaryMin ?? null,
        salaryMax: value.salaryMax ?? null,
        benefits: value.benefits || undefined,
        tools: value.tools || undefined,
        commissions: value.commissions || undefined,
        modality: value.modality,
        schedule: value.schedule || undefined,
        countryCode: value.countryCode || undefined,
        regionCode: value.regionCode || undefined,
        requiresPsychometry: value.requiresPsychometry,
        targetDeliveryDate: value.targetDeliveryDate || undefined,
      });

      // Save checklist items after vacancy creation
      if (vacancy?.id && checklist.length > 0) {
        for (let i = 0; i < checklist.length; i++) {
          if (checklist[i].trim()) {
            await addChecklistItemAction(vacancy.id, checklist[i].trim(), i);
          }
        }
      }

      onClose();
    },
  });

  const handleClientChange = useCallback(
    async (clientId: string) => {
      form.setFieldValue("clientId", clientId);
      if (clientId) {
        const { saleType: st } = await checkClientSaleTypeAction(clientId);
        setSaleType(st);
      } else {
        setSaleType("NUEVA");
      }
    },
    [form]
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
    saleType,
    checklist,
    sendNotification,
    setSendNotification,
    detailsModal,
    isSubmitting: createVacancyMutation.isPending,
    handleClientChange,
    addChecklistItem,
    updateChecklistItem,
    removeChecklistItem,
  };
}
