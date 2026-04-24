"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsQueryKeys } from "@core/shared/constants/query-keys";
import {
  useSectors,
  useSubsectorsBySector,
  useLeadOrigins,
} from "./useCatalogs";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";
import { editLeadSchema } from "../schemas/lead.schema";
import { useCallback, useRef, useState } from "react";
import type { Lead } from "../types";
import type { CommercialTermsFormData } from "@features/Finanzas/Clientes/frontend/types/client.types";
import { showToast } from "@/core/shared/components/ShowToast";
import {
  updateLeadAction,
  updateLeadStatusAction,
} from "../../server/presentation/actions/lead.actions";

/** Datos pendientes cuando se requiere el diálogo de condiciones comerciales */
export interface PendingCommercialTerms {
  leadId: string;
  companyName: string;
  formData: Partial<Omit<Lead, "status">>;
}

interface UseEditLeadFormParams {
  lead: Lead;
  onOpenChange: (open: boolean) => void;
  /** Callback invocado cuando la transición a POSICIONES_ASIGNADAS requiere condiciones comerciales */
  onCommercialTermsRequired?: (pending: PendingCommercialTerms) => void;
}

export function useEditLeadForm({
  lead,
  onOpenChange,
  onCommercialTermsRequired,
}: UseEditLeadFormParams) {
  const queryClient = useQueryClient();
  const [selectedSectorId, setSelectedSectorId] = useState<string | undefined>(
    lead.sectorId ?? undefined,
  );

  // Ref para almacenar los datos del form pendientes mientras el dialog está abierto
  const pendingFormDataRef = useRef<Partial<Omit<Lead, "status">> | null>(null);

  const { data: sectors = [] } = useSectors();
  const { data: subsectors = [] } = useSubsectorsBySector(
    selectedSectorId ?? null,
  );
  const { data: origins = [] } = useLeadOrigins();
  const { data: users = [] } = useTenantUsersQuery();

  const editLeadMutation = useMutation({
    mutationFn: async ({
      leadId,
      data,
      newStatus,
      commercialTerms,
    }: {
      leadId: string;
      data: Partial<Omit<Lead, "status">>;
      newStatus?: string;
      commercialTerms?: CommercialTermsFormData;
    }) => {
      // Update general fields
      const updateResult = await updateLeadAction(leadId, data);
      if (updateResult.error) {
        throw new Error(updateResult.error);
      }

      // If status changed, update it separately (records history)
      if (newStatus) {
        const statusResult = await updateLeadStatusAction(
          leadId,
          newStatus as Lead["status"],
          commercialTerms,
        );
        if (statusResult.error) {
          throw new Error(statusResult.error);
        }
        return statusResult.lead;
      }

      return updateResult.lead;
    },
    onSuccess: (updatedLead) => {
      // Invalidate paginated (table view)
      queryClient.invalidateQueries({
        queryKey: leadsQueryKeys.paginated(),
        refetchType: "active",
      });

      // Invalidate infinite (kanban) for affected statuses
      if (updatedLead?.status) {
        queryClient.invalidateQueries({
          queryKey: leadsQueryKeys.infiniteAll(),
          predicate: (query) => {
            const key = query.queryKey as string[];
            return key[3] === updatedLead.status || key[3] === lead.status;
          },
          refetchType: "active",
        });
      }

      // Invalidate detail query
      if (updatedLead?.id) {
        queryClient.invalidateQueries({
          queryKey: leadsQueryKeys.detail(updatedLead.id),
        });
      }

      showToast({
        type: "success",
        title: "Lead actualizado",
        description: "El lead se ha actualizado correctamente",
      });
    },
    onError: (error: Error) => {
      // Datos incompletos: el usuario ya está en el form, mostrar mensaje descriptivo
      if (error.message === "INCOMPLETE_DATA") {
        showToast({
          type: "error",
          title: "Datos incompletos",
          description:
            "Completa todos los campos obligatorios antes de avanzar a este estado",
        });
        return;
      }

      showToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al actualizar el lead",
      });
    },
  });

  const form = useForm({
    defaultValues: {
      companyName: lead.companyName,
      website: lead.website ?? "",
      linkedInUrl: lead.linkedInUrl ?? "",
      countryCode: lead.countryCode ?? "",
      regionCode: lead.regionCode ?? "",
      postalCode: lead.postalCode ?? "",
      subOrigin: lead.subOrigin ?? "",
      employeeCount: lead.employeeCount ?? "",
      notes: lead.notes ?? "",
      status: lead.status,
      sectorId: lead.sectorId ?? "",
      subsectorId: lead.subsectorId ?? "",
      originId: lead.originId ?? "",
      assignedToId: lead.assignedToId ?? "",
    },
    validators: {
      onSubmit: editLeadSchema,
    },
    onSubmit: async ({ value }) => {
      const { status, ...dataWithoutStatus } = value;
      const isStatusChanging = status !== lead.status;

      // Interceptar: si el nuevo status es POSICIONES_ASIGNADAS, pedir condiciones comerciales
      if (
        isStatusChanging &&
        status === "POSICIONES_ASIGNADAS" &&
        onCommercialTermsRequired
      ) {
        pendingFormDataRef.current = dataWithoutStatus;
        onCommercialTermsRequired({
          leadId: lead.id,
          companyName: value.companyName,
          formData: dataWithoutStatus,
        });
        return;
      }

      await editLeadMutation.mutateAsync({
        leadId: lead.id,
        data: dataWithoutStatus,
        newStatus: isStatusChanging ? status : undefined,
      });

      onOpenChange(false);
    },
  });

  /** Completa la mutación pendiente con las condiciones comerciales del diálogo */
  const submitWithCommercialTerms = useCallback(
    async (commercialTerms: CommercialTermsFormData) => {
      const formData = pendingFormDataRef.current;
      if (!formData) return;

      await editLeadMutation.mutateAsync({
        leadId: lead.id,
        data: formData,
        newStatus: "POSICIONES_ASIGNADAS",
        commercialTerms,
      });

      pendingFormDataRef.current = null;
      onOpenChange(false);
    },
    [lead.id, editLeadMutation, onOpenChange],
  );

  /** Cancela la mutación pendiente (el usuario cerró el diálogo sin confirmar) */
  const cancelCommercialTerms = useCallback(() => {
    pendingFormDataRef.current = null;
  }, []);

  const handleSectorChange = (value: string | undefined) => {
    setSelectedSectorId(value);
    form.setFieldValue("sectorId", value ?? "");
    form.setFieldValue("subsectorId", "");
  };

  return {
    form,
    sectors,
    subsectors,
    origins,
    selectedSectorId,
    handleSectorChange,
    isSubmitting: editLeadMutation.isPending,
    users,
    submitWithCommercialTerms,
    cancelCommercialTerms,
  };
}
