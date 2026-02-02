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

interface Props {
  isOpen: boolean;
  onOpenChange: () => void;
  textToConfirm?: string;
  onConfirmDelete?: () => void;
  isLoading?: boolean;
}

export const DeleteInteractionAlertDialog = ({
  isOpen,
  onOpenChange,
  textToConfirm,
  onConfirmDelete,
  isLoading = false,
}: Props) => {
  const [inputValue, setInputValue] = useState("");

  const isMatch = inputValue.trim() === textToConfirm;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Estás seguro que deseas eliminar esta interaccion?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción <b>no se puede deshacer</b>. Para confirmar, por favor
            escribe <b>{textToConfirm}</b> debajo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-3">
          <Input
            autoFocus
            placeholder="A continuacion: "
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            data-testid="delete-interaction-confirm-input"
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
              data-testid="delete-user-confirm-btn"
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
