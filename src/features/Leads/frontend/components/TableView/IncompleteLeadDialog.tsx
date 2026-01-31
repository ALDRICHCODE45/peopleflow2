"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shadcn/alert-dialog";

interface IncompleteLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingFields: string[];
  onEditLead: () => void;
}

export function IncompleteLeadDialog({
  open,
  onOpenChange,
  missingFields,
  onEditLead,
}: IncompleteLeadDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Datos incompletos</AlertDialogTitle>
          <AlertDialogDescription>
            Para avanzar a Contacto Calido o estados posteriores, completa los
            siguientes campos:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {missingFields.map((field) => (
            <li key={field} className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-muted-foreground/50" />
              {field}
            </li>
          ))}
        </ul>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onOpenChange(false);
              onEditLead();
            }}
          >
            Completar datos
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
