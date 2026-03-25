"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useEffect, useRef } from "react";
import { addDays, isWeekend, nextMonday, parseISO, format } from "date-fns";
import { useUpdateVacancy } from "./useUpdateVacancy";
import { useVacancyDetailQuery } from "./useVacancyDetailQuery";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";
import { useClientsForSelect } from "./useClientsForSelect";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { useModalState } from "@/core/shared/hooks/useModalState";
import {
  addChecklistItemAction,
  updateChecklistItemAction,
  deleteChecklistItemAction,
} from "../../server/presentation/actions/checklist.actions";
import { vacancyQueryKeys } from "@core/shared/constants/query-keys";
import type { VacancyServiceType, VacancyDTO } from "../types/vacancy.types";
import type { VacancyFormValues } from "../types/vacancy-form.types";

/** Tracks a checklist item during editing — existing items have an `id`. */
interface EditableChecklistItem {
  id: string | null;
  requirement: string;
}

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

export function useEditVacancyForm({
  onClose,
  vacancy,
  canEditTargetDeliveryDate,
}: {
  onClose: () => void;
  vacancy: VacancyDTO;
  canEditTargetDeliveryDate: boolean;
}) {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const updateVacancyMutation = useUpdateVacancy();
  const { data: users = [] } = useTenantUsersQuery();
  const { data: clients = [] } = useClientsForSelect();

  const detailsModal = useModalState();

  // Fetch the full vacancy detail (includes checklistItems).
  // The vacancy prop comes from the list query which does NOT include checklistItems.
  const { data: fullVacancy } = useVacancyDetailQuery(vacancy.id);

  // ── Checklist state ────────────────────────────────────────
  // Use checklistItems from the detail query when available, otherwise fall back to the prop
  const resolvedChecklist = fullVacancy?.checklistItems ?? vacancy.checklistItems ?? [];

  const initialChecklist: EditableChecklistItem[] = resolvedChecklist
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((item) => ({ id: item.id, requirement: item.requirement }));

  const [checklist, setChecklist] = useState<EditableChecklistItem[]>(initialChecklist);
  const checklistSyncedRef = useRef(false);

  // Sync checklist when the detail query resolves (only once)
  useEffect(() => {
    if (fullVacancy?.checklistItems && !checklistSyncedRef.current) {
      checklistSyncedRef.current = true;
      const items: EditableChecklistItem[] = fullVacancy.checklistItems
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((item) => ({ id: item.id, requirement: item.requirement }));
      setChecklist(items);
    }
  }, [fullVacancy?.checklistItems]);

  const addChecklistItem = useCallback(() => {
    setChecklist((prev) => [...prev, { id: null, requirement: "" }]);
  }, []);

  const updateChecklistItem = useCallback((index: number, value: string) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, requirement: value } : item)),
    );
  }, []);

  const removeChecklistItem = useCallback((index: number) => {
    setChecklist((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const defaultValues: VacancyFormValues = {
    position: vacancy.position,
    recruiterId: vacancy.recruiterId,
    clientId: vacancy.clientId,
    serviceType: vacancy.serviceType ?? "",
    currency: vacancy.currency ?? "",
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
        },
      });

      // ── Sync checklist items ─────────────────────────────────
      const originalChecklistItems = fullVacancy?.checklistItems ?? vacancy.checklistItems ?? [];
      const existingIds = new Set(checklist.filter((c) => c.id).map((c) => c.id!));
      const originalIds = new Set(originalChecklistItems.map((i) => i.id));

      // Delete removed items
      for (const origId of originalIds) {
        if (!existingIds.has(origId)) {
          await deleteChecklistItemAction(origId);
        }
      }

      // Add new items & update existing ones
      for (let i = 0; i < checklist.length; i++) {
        const item = checklist[i];
        if (!item.requirement.trim()) continue;

        if (item.id) {
          // Existing item — update requirement and order
          const original = originalChecklistItems.find((o) => o.id === item.id);
          if (original && (original.requirement !== item.requirement.trim() || original.order !== i)) {
            await updateChecklistItemAction(item.id, {
              requirement: item.requirement.trim(),
              order: i,
            });
          }
        } else {
          // New item — add
          await addChecklistItemAction(vacancy.id, item.requirement.trim(), i);
        }
      }

      // Invalidate detail query so VacancyDetailSheet refetches with updated checklist
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.detail(tenant.id, vacancy.id),
        });
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

  return {
    form,
    users,
    clients,
    checklist,
    detailsModal,
    canEditTargetDeliveryDate,
    isSubmitting: updateVacancyMutation.isPending,
    handleClientChange,
    addChecklistItem,
    updateChecklistItem,
    removeChecklistItem,
  };
}

/**
 * Return type for useEditVacancyForm.
 * Extracted via ReturnType to avoid manually specifying TanStack Form's 12 generics.
 */
export type UseEditVacancyFormReturn = ReturnType<typeof useEditVacancyForm>;
