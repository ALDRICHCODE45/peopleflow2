"use client";

import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { useAddInteraction } from "./useInteractions";
import { createInteractionSchema } from "../schemas/interaction.schema";
import type { InteractionType } from "../types";

interface UseCreateInteractionFormProps {
  fixedContactId?: string;
  onSuccess: () => void;
}

export function useCreateInteractionForm({
  fixedContactId,
  onSuccess,
}: UseCreateInteractionFormProps) {
  const addInteractionMutation = useAddInteraction();

  const form = useForm({
    defaultValues: {
      contactId: fixedContactId ?? "",
      type: "CALL" as InteractionType,
      subject: "",
      content: "",
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    },
    validators: {
      onSubmit: createInteractionSchema,
    },
    onSubmit: async ({ value }) => {
      await addInteractionMutation.mutateAsync({
        contactId: value.contactId,
        type: value.type,
        subject: value.subject,
        content: value.content || undefined,
        date: value.date ? new Date(value.date).toISOString() : undefined,
      });
      onSuccess();
    },
  });

  return {
    form,
    isSubmitting: addInteractionMutation.isPending,
  };
}
