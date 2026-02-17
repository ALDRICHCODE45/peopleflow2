import { Separator } from "@/core/shared/ui/shadcn/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@shadcn/dialog";
import { CreateContactForm } from "./CreateContactForm";
import { EditContactForm } from "./EditContactForm";
import type { Contact } from "../../types";

interface CreateContactDialogSheetProps {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateContactDialogSheet = ({
  leadId,
  open,
  onOpenChange,
}: CreateContactDialogSheetProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-sm md:min-w-xl">
        <DialogHeader>
          <DialogTitle>Agregar contacto</DialogTitle>
          <DialogDescription>
            Ingresa los siguientes campos para completar el registro:
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <CreateContactForm leadId={leadId} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
};

interface EditContactDialogSheetProps {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditContactDialogSheet = ({
  contact,
  open,
  onOpenChange,
}: EditContactDialogSheetProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-sm md:min-w-xl">
        <DialogHeader>
          <DialogTitle>Editar contacto</DialogTitle>
          <DialogDescription>
            Modifica los campos necesarios del contacto:
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <EditContactForm contact={contact} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
};
