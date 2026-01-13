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
import { Spinner } from "@/core/shared/ui/shadcn/spinner";

interface DeleteVacancyAlertDialogProps {
  isOpen: boolean;
  onOpenChange: () => void;
  vacancyToDelete?: string;
  onConfirmDelete?: () => void;
  isLoading?: boolean;
}

export const DeleteColaboradorAlertDialog = ({
  isOpen,
  onOpenChange,
  vacancyToDelete,
  onConfirmDelete,
  isLoading = false,
}: DeleteVacancyAlertDialogProps) => {
  const [inputValue, setInputValue] = useState("");

  const isMatch = inputValue.trim() === vacancyToDelete;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg">
            ¿Estás seguro que deseas eliminar esta vacante?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            Esta acción <b>no se puede deshacer</b>. Para confirmar, por favor
            escribe <b>{vacancyToDelete}</b> debajo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-3">
          <Input
            autoFocus
            placeholder="Escribe el titulo de la vacante"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            data-testid="delete-vacancy-confirm-input"
          />
          {!isMatch && inputValue.length > 0 && (
            <span className="text-xs text-red-500 mt-1 block">
              El titulo no coincide.
            </span>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <Button asChild variant={"destructive"}>
            <AlertDialogAction
              disabled={!isMatch || isLoading}
              onClick={onConfirmDelete}
              data-testid="delete-vacancy-confirm-btn"
            >
              {isLoading ? (
                <div className="flex items-center justify-between text-center">
                  <Spinner />
                  Eliminando...
                </div>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
