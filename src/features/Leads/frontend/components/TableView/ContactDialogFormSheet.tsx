import { Separator } from "@/core/shared/ui/shadcn/separator";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shadcn/dialog";
import { ContactFormData } from "../../types";
import { ContactForm } from "./ContactForm";
import { Button } from "@/core/shared/ui/shadcn/button";

interface Props {
  onSubmit: (data: ContactFormData) => Promise<void>;
  isLoading?: boolean;
  initialData?: ContactFormData;

  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ContactDialogFormSheet = ({
  onSubmit,
  isLoading,
  initialData,

  open,
  onOpenChange,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-sm  md:min-w-xl">
        <DialogHeader>
          <DialogTitle>Formulario de contacto</DialogTitle>
          <DialogDescription>
            Ingresa los siguientes campos para completar el registro:
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <ContactForm
          onSubmit={onSubmit}
          isLoading={isLoading}
          initialData={initialData}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
