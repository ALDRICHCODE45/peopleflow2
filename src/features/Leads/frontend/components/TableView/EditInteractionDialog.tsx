"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/core/shared/ui/shadcn/dialog";
import { EditInteractionForm } from "./EditInteractionForm";
import type { Contact, Interaction } from "../../types";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
  interaction: Interaction;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditInteractionDialog({
  isOpen,
  onOpenChange,
  contact,
  interaction,
  onSuccess,
  onCancel,
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
        <EditInteractionForm
          interaction={interaction}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
