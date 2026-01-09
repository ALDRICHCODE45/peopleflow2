import { Button } from "@shadcn/button";
import { ReactElement, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@shadcn/alert-dialog";
import { TryCatch } from "@/core/shared/helpers/tryCatch";
import { showToast } from "./ShowToast";

interface ConfirmDialogProps {
  title: string;
  description: string;
  action: () => void | Promise<void>;
  trigger?: ReactElement;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onOpenChange?: (open: boolean) => void;
}

export const ConfirmDialog = ({
  action,
  description,
  title,
  trigger,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "destructive",
  onOpenChange,
}: ConfirmDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    const result = await TryCatch(Promise.resolve(action()));

    if (!result.ok) {
      showToast({
        type: "error",
        title: "Ocurrió un error",
        description:
          "No se pudo completar la acción. Por favor, intenta nuevamente o contacta al soporte si el problema persiste.",
      });
      setIsLoading(false);
      return;
    }

    setOpen(false);
    setIsLoading(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      ) : (
        <AlertDialogTrigger asChild>
          <Button variant="outline">{title}</Button>
        </AlertDialogTrigger>
      )}

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>

          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Procesando..." : confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
