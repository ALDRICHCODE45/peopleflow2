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
import { Button } from "@/core/shared/ui/shadcn/button";

import { useBulkDeleteVacancies } from "../hooks/useBulkDeleteVacancies";

interface BulkDeleteVacanciesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds?: string[];
  vacancyIds?: string[];
  onCompleted?: () => void;
}

export function BulkDeleteVacanciesDialog({
  open,
  onOpenChange,
  selectedIds,
  vacancyIds,
  onCompleted,
}: BulkDeleteVacanciesDialogProps) {
  const mutation = useBulkDeleteVacancies();
  const ids = selectedIds ?? vacancyIds ?? [];

  const handleConfirm = async () => {
    try {
      await mutation.mutateAsync(ids);
    } catch {
      // Toast handled in hook
    } finally {
      onOpenChange(false);
      onCompleted?.();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Eliminar {ids.length} vacante{ids.length === 1 ? "" : "s"}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción es irreversible. Se eliminarán las vacantes seleccionadas y todos sus
            datos asociados.
            <br />
            Si alguna vacante tiene facturas vinculadas, no se podrá eliminar y se mostrará en el
            resultado.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancelar</AlertDialogCancel>
          <Button asChild variant="destructive">
            <AlertDialogAction disabled={mutation.isPending} onClick={handleConfirm}>
              {mutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
