"use client";

import { useForm } from "@tanstack/react-form";
import { useState, useCallback } from "react";
import { useUpdateVacancy } from "./useUpdateVacancy";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";
import { useClientsForSelect } from "./useClientsForSelect";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { checkClientSaleTypeAction } from "../../server/presentation/actions/checkClientSaleType.action";
import type { VacancySaleType, VacancyModality, VacancyDTO } from "../types/vacancy.types";

export function useEditVacancyForm({
  onClose,
  vacancy,
}: {
  onClose: () => void;
  vacancy: VacancyDTO;
}) {
  const updateVacancyMutation = useUpdateVacancy();
  const { data: users = [] } = useTenantUsersQuery();
  const { data: clients = [] } = useClientsForSelect();

  const [saleType, setSaleType] = useState<VacancySaleType>(vacancy.saleType);
  const detailsModal = useModalState();

  const today = new Date();
  const defaultDelivery = new Date(today);
  defaultDelivery.setDate(today.getDate() + 7);

  const form = useForm({
    defaultValues: {
      position: vacancy.position,
      recruiterId: vacancy.recruiterId,
      clientId: vacancy.clientId,
      assignedAt: vacancy.assignedAt,
      targetDeliveryDate:
        vacancy.targetDeliveryDate ?? defaultDelivery.toISOString().split("T")[0],
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
        data: { ...value },
      });
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
    [form],
  );

  return {
    form,
    users,
    clients,
    saleType,
    detailsModal,
    isSubmitting: updateVacancyMutation.isPending,
    handleClientChange,
  };
}
