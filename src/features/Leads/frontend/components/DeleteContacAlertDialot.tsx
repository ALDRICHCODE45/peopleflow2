import { useState } from "react";
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
import { Input } from "@shadcn/input";
import { Button } from "@shadcn/button";

interface DeleteContactAlertDialog {
  isOpen: boolean;
  onOpenChange: () => void;
  contactNameToDelete?: string;
  onConfirmDelete?: () => void;
  isLoading?: boolean;
}

export const DeleteContactAlertDialog = ({
  isOpen,
  onOpenChange,
  contactNameToDelete,
  onConfirmDelete,
  isLoading = false,
}: DeleteContactAlertDialog) => {
  const [inputValue, setInputValue] = useState("");

  const isMatch = inputValue.trim() === contactNameToDelete;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Estás seguro que deseas eliminar este contacto?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción <b>no se puede deshacer</b>. Para confirmar, por favor
            escribe <b>{contactNameToDelete}</b> debajo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-3">
          <Input
            autoFocus
            placeholder="Escribe el nombre de contacto"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            data-testid="delete-contact-confirm-input"
          />
          {!isMatch && inputValue.length > 0 && (
            <span className="text-xs text-red-500 mt-1 block">
              El nombre no coincide.
            </span>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <Button asChild variant={"destructive"}>
            <AlertDialogAction
              disabled={!isMatch || isLoading}
              onClick={onConfirmDelete}
              data-testid="delete-contact-confirm-btn"
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
