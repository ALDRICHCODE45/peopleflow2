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
import { useDeleteUserFromTenant } from "../hooks/useUsers";
import type { TenantUser } from "../types";

interface DeleteUserAlertDialogProps {
  user: TenantUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteUserAlertDialog({
  user,
  open,
  onOpenChange,
}: DeleteUserAlertDialogProps) {
  const deleteUserMutation = useDeleteUserFromTenant();

  const handleConfirm = async () => {
    await deleteUserMutation.mutateAsync(user.id);
    onOpenChange(false);
  };

  const isLoading = deleteUserMutation.isPending;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Usuario</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará al usuario <strong>{user.email}</strong> de
            este tenant. El usuario seguirá existiendo en el sistema y podrá
            tener acceso a otros tenants.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
