"use client";

import { useForm } from "@tanstack/react-form";
import { useAddContact } from "./useContacts";
import { createContactSchema } from "../schemas/contact.schema";

export function useCreateContactForm({
  leadId,
  onOpenChange,
}: {
  leadId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const addContactMutation = useAddContact();

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      linkedInUrl: "",
      isPrimary: false,
      notes: "",
    },
    validators: {
      onSubmit: createContactSchema,
    },
    onSubmit: async ({ value }) => {
      await addContactMutation.mutateAsync({ leadId, data: value });
      onOpenChange(false);
    },
  });

  return {
    form,
    isSubmitting: addContactMutation.isPending,
  };
}
