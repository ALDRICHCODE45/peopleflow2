"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useSectors,
  useSubsectorsBySector,
  useLeadOrigins,
} from "./useCatalogs";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";
import { editLeadSchema } from "../schemas/lead.schema";
import { useState } from "react";
import type { Lead } from "../types";
import { showToast } from "@/core/shared/components/ShowToast";
import {
  updateLeadAction,
  updateLeadStatusAction,
} from "../../server/presentation/actions/lead.actions";

export function useEditLeadForm({
  lead,
  onOpenChange,
}: {
  lead: Lead;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [selectedSectorId, setSelectedSectorId] = useState<string | undefined>(
    lead.sectorId ?? undefined,
  );

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
    }: {
      leadId: string;
      data: Partial<Omit<Lead, "status">>;
      newStatus?: string;
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
        queryKey: ["leads", "paginated"],
        refetchType: "active",
      });

      // Invalidate infinite (kanban) for affected statuses
      if (updatedLead?.status) {
        queryClient.invalidateQueries({
          queryKey: ["leads", "infinite"],
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
          queryKey: ["leads", "detail", updatedLead.id],
        });
      }

      showToast({
        type: "success",
        title: "Lead actualizado",
        description: "El lead se ha actualizado correctamente",
      });
    },
    onError: (error: Error) => {
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
      sectorId: lead.sectorId ?? undefined,
      subsectorId: lead.subsectorId ?? undefined,
      originId: lead.originId ?? undefined,
      assignedToId: lead.assignedToId ?? "",
    },
    validators: {
      onSubmit: editLeadSchema,
    },
    onSubmit: async ({ value }) => {
      const { status, ...dataWithoutStatus } = value;

      await editLeadMutation.mutateAsync({
        leadId: lead.id,
        data: dataWithoutStatus,
        newStatus: status !== lead.status ? status : undefined,
      });

      onOpenChange(false);
    },
  });

  const handleSectorChange = (value: string | undefined) => {
    setSelectedSectorId(value);
    form.setFieldValue("sectorId", value);
    form.setFieldValue("subsectorId", undefined);
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
  };
}
