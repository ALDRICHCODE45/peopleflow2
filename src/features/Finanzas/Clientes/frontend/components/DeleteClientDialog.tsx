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
import { Spinner } from "@/core/shared/ui/shadcn/spinner";
import type { DeleteClientDialogProps } from "../types/client.types";

/**
 * Confirmation dialog for client deletion.
 * Loaded lazily by ClientRowActions via next/dynamic.
 */
export function DeleteClientDialog({
  isOpen,
  onOpenChange,
  onConfirmDelete,
  clientName,
  isLoading = false,
}: DeleteClientDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Cliente</AlertDialogTitle>
          <AlertDialogDescription>
            Estas seguro de que deseas eliminar el cliente{" "}
            <strong>{clientName}</strong>? Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <Spinner className="size-4 mr-2" />
            ) : null}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
