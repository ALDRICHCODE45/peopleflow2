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

interface DeleteInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  invoiceFolio: string;
  isLoading?: boolean;
}

/**
 * Confirmation dialog for invoice deletion.
 * Loaded lazily by InvoiceRowActions via next/dynamic.
 */
export function DeleteInvoiceDialog({
  isOpen,
  onOpenChange,
  onConfirmDelete,
  invoiceFolio,
  isLoading = false,
}: DeleteInvoiceDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Factura</AlertDialogTitle>
          <AlertDialogDescription>
            Estas seguro de que deseas eliminar la factura{" "}
            <strong>{invoiceFolio}</strong>? Esta accion no se puede deshacer.
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
