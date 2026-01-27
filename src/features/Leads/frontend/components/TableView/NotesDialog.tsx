import { Separator } from "@/core/shared/ui/shadcn/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shadcn/dialog";

interface Props {
  notes: string;
  trigger: React.ReactNode;
}

export const NotesDialog = ({ trigger, notes }: Props) => {
  return (
    <Dialog>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notas</DialogTitle>
          <DialogDescription>
            las notas del lead son las siguientes:
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="">{notes}</div>
      </DialogContent>
    </Dialog>
  );
};
