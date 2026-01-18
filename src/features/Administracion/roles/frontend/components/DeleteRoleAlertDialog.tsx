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
import { useDeleteRole } from "../hooks/useRoles";
import type { RoleWithStats } from "../types";

interface DeleteRoleAlertDialogProps {
  role: RoleWithStats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteRoleAlertDialog({
  role,
  open,
  onOpenChange,
}: DeleteRoleAlertDialogProps) {
  const deleteRoleMutation = useDeleteRole();

  const handleConfirm = async () => {
    await deleteRoleMutation.mutateAsync(role.id);
    onOpenChange(false);
  };

  const isLoading = deleteRoleMutation.isPending;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Rol</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente el rol{" "}
            <strong>{role.name}</strong>. Esta acción no se puede deshacer.
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
