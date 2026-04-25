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
} from "@/core/shared/ui/shadcn/alert-dialog";
import { useToggleUserActive } from "../hooks/useUsers";
import type { TenantUser } from "../types";

interface ToggleUserActiveDialogProps {
  user: TenantUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ToggleUserActiveDialog({
  user,
  open,
  onOpenChange,
}: ToggleUserActiveDialogProps) {
  const toggleMutation = useToggleUserActive();

  const handleConfirm = async () => {
    await toggleMutation.mutateAsync({
      userId: user.id,
      isActive: !user.isActive, // Toggle al estado opuesto
    });
    onOpenChange(false);
  };

  const isLoading = toggleMutation.isPending;

  // Textos dinámicos según la acción
  const actionCapitalized = user.isActive ? "Desactivar" : "Activar";
  const description = user.isActive
    ? `Esta acción desactivará al usuario ${user.name || user.email}. El usuario no podrá iniciar sesión hasta que se reactive manualmente.`
    : `Esta acción activará al usuario ${user.name || user.email}. El usuario podrá iniciar sesión normalmente.`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{actionCapitalized} Usuario</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={
              user.isActive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {isLoading
              ? `${actionCapitalized.slice(0, -1)}ando...`
              : actionCapitalized}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
