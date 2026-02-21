"use client";

import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { useUpdateInteraction } from "./useInteractions";
import { editInteractionSchema } from "../schemas/interaction.schema";
import type { Interaction } from "../types";

interface UseEditInteractionFormProps {
  interaction: Interaction;
  onSuccess: () => void;
}

export function useEditInteractionForm({
  interaction,
  onSuccess,
}: UseEditInteractionFormProps) {
  const updateInteractionMutation = useUpdateInteraction();

  const form = useForm({
    defaultValues: {
      type: interaction.type,
      subject: interaction.subject,
      content: interaction.content ?? "",
      date: format(new Date(interaction.date), "yyyy-MM-dd'T'HH:mm"),
    },
    validators: {
      onSubmit: editInteractionSchema,
    },
    onSubmit: async ({ value }) => {
      await updateInteractionMutation.mutateAsync({
        interactionId: interaction.id,
        contactId: interaction.contactId,
        data: {
          type: value.type,
          subject: value.subject,
          content: value.content || null,
          date: value.date ? new Date(value.date).toISOString() : undefined,
        },
      });
      onSuccess();
    },
  });

  return {
    form,
    isSubmitting: updateInteractionMutation.isPending,
  };
}
