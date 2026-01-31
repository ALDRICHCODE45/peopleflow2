"use client";

import { useForm } from "@tanstack/react-form";
import { useUpdateLead, useUpdateLeadStatus } from "./useLeads";
import {
  useSectors,
  useSubsectorsBySector,
  useLeadOrigins,
} from "./useCatalogs";
import { editLeadSchema } from "../schemas/lead.schema";
import { useState } from "react";
import type { Lead } from "../types";

export function useEditLeadForm({
  lead,
  onOpenChange,
}: {
  lead: Lead;
  onOpenChange: (open: boolean) => void;
}) {
  const updateLeadMutation = useUpdateLead();
  const updateStatusMutation = useUpdateLeadStatus();
  const [selectedSectorId, setSelectedSectorId] = useState<string | undefined>(
    lead.sectorId ?? undefined,
  );

  const { data: sectors = [] } = useSectors();
  const { data: subsectors = [] } = useSubsectorsBySector(
    selectedSectorId ?? null,
  );
  const { data: origins = [] } = useLeadOrigins();

  const form = useForm({
    defaultValues: {
      companyName: lead.companyName,
      website: lead.website ?? "",
      linkedInUrl: lead.linkedInUrl ?? "",
      address: lead.address ?? "",
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

      // Update general fields (without status)
      await updateLeadMutation.mutateAsync({
        leadId: lead.id,
        data: dataWithoutStatus,
      });

      // If status changed, use dedicated action (records history)
      if (status !== lead.status) {
        await updateStatusMutation.mutateAsync({
          leadId: lead.id,
          newStatus: status,
        });
      }

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
    isSubmitting: updateLeadMutation.isPending || updateStatusMutation.isPending,
  };
}
