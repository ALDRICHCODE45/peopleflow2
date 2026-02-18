import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/core/shared/ui/shadcn/dialog";
import { CreateInteractionForm } from "./CreateInteractionForm";
import type { Contact } from "../../types";

interface Props {
  isOpen: boolean;
  onOpenChange: () => void;
  contact: Contact;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ContactInteractionDialog = ({
  isOpen,
  onOpenChange,
  contact,
  onSuccess,
  onCancel,
}: Props) => {
  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ingresa una nueva interacción</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <CreateInteractionForm
          contacts={[contact]}
          fixedContactId={contact.id}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </DialogContent>
    </Dialog>
  );
};
