import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/shared/ui/shadcn/dialog";
import { InteractionForm } from "./InteractionForm";

import type {
  Contact,
  InteractionFormData,
  InteractionType,
} from "../../types";

interface Props {
  isOpen: boolean;
  onOpenChange: () => void;

  contact: Contact;
  onSubmit: (data: InteractionFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<InteractionFormData>;
  /** When true, hides the contact selector (useful for single-contact dialogs) */
  hideContactSelector?: boolean;
  /** Fixed contactId when hideContactSelector is true */
  fixedContactId?: string;
}

export const ContactInteractionDialog = ({
  isOpen,
  onOpenChange,
  contact,
  onCancel,
  hideContactSelector,
  fixedContactId,
  onSubmit,
  isLoading,
}: Props) => {
  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={isOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingresa una nueva interaccion</DialogTitle>
            <DialogDescription></DialogDescription>
            <Card>
              <CardContent className="pt-4">
                <InteractionForm
                  contacts={[contact]}
                  onSubmit={onSubmit}
                  onCancel={onCancel}
                  isLoading={isLoading}
                  hideContactSelector
                  fixedContactId={contact.id}
                />
              </CardContent>
            </Card>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};
