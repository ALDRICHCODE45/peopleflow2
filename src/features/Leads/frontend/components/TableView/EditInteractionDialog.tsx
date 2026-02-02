"use client";

import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/core/shared/ui/shadcn/dialog";
import { InteractionForm } from "./InteractionForm";
import type { Contact, Interaction, InteractionFormData } from "../../types";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
  interaction: Interaction;
  onSubmit: (data: InteractionFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EditInteractionDialog({
  isOpen,
  onOpenChange,
  contact,
  interaction,
  onSubmit,
  onCancel,
  isLoading,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar interacción</DialogTitle>
          <DialogDescription>
            Modifica los datos de la interacción con {contact.firstName}{" "}
            {contact.lastName}
          </DialogDescription>
        </DialogHeader>
        <Card>
          <CardContent className="pt-4">
            <InteractionForm
              contacts={[contact]}
              onSubmit={onSubmit}
              onCancel={onCancel}
              isLoading={isLoading}
              isEditMode
              hideContactSelector
              fixedContactId={contact.id}
              initialData={{
                type: interaction.type,
                subject: interaction.subject,
                content: interaction.content ?? "",
                date: new Date(interaction.date).toISOString().slice(0, 16),
                contactId: interaction.contactId,
              }}
            />
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
