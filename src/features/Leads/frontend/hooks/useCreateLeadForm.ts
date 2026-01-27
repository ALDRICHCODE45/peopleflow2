"use client";

import { useForm } from "@tanstack/react-form";
import { useCreateLead } from "./useLeads";
import {
  useSectors,
  useSubsectorsBySector,
  useLeadOrigins,
} from "./useCatalogs";
import { createLeadSchema } from "../schemas/lead.schema";
import { useState } from "react";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";

export function useCreateLeadForm({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const createLeadMutation = useCreateLead();
  const [selectedSectorId, setSelectedSectorId] = useState<string | undefined>(
    undefined,
  );

  const { data: sectors = [] } = useSectors();
  const { data: subsectors = [] } = useSubsectorsBySector(
    selectedSectorId ?? null,
  );
  const { data: origins = [] } = useLeadOrigins();

  const { data: users = [], isPending } = useTenantUsersQuery();

  const form = useForm({
    defaultValues: {
      companyName: "",
      rfc: "",
      website: "",
      linkedInUrl: "",
      address: "",
      notes: "",
      sectorId: undefined as string | undefined,
      subsectorId: undefined as string | undefined,
      originId: undefined as string | undefined,
      assignedToId: "",
    },
    validators: {
      onSubmit: createLeadSchema,
    },
    onSubmit: async ({ value }) => {
      await createLeadMutation.mutateAsync(value);
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
    isSubmitting: createLeadMutation.isPending,
    users,
  };
}
