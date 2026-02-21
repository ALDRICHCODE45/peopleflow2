"use client";

import { useForm } from "@tanstack/react-form";
import { useUpdateContact } from "./useContacts";
import { editContactSchema } from "../schemas/contact.schema";
import type { Contact } from "../types";

export function useEditContactForm({
  contact,
  onOpenChange,
}: {
  contact: Contact;
  onOpenChange: (open: boolean) => void;
}) {
  const updateContactMutation = useUpdateContact();

  const form = useForm({
    defaultValues: {
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      position: contact.position ?? "",
      linkedInUrl: contact.linkedInUrl ?? "",
      isPrimary: contact.isPrimary,
      notes: contact.notes ?? "",
    },
    validators: {
      onSubmit: editContactSchema,
    },
    onSubmit: async ({ value }) => {
      await updateContactMutation.mutateAsync({
        contactId: contact.id,
        leadId: contact.leadId,
        data: value,
      });
      onOpenChange(false);
    },
  });

  return {
    form,
    isSubmitting: updateContactMutation.isPending,
  };
}
