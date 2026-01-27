"use client";

import { useForm } from "@tanstack/react-form";
import { useUpdateLead } from "./useLeads";
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
      rfc: lead.rfc ?? "",
      website: lead.website ?? "",
      linkedInUrl: lead.linkedInUrl ?? "",
      address: lead.address ?? "",
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
      await updateLeadMutation.mutateAsync({
        leadId: lead.id,
        data: value,
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
    isSubmitting: updateLeadMutation.isPending,
  };
}
