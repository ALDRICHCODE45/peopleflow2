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

import { useBulkDuplicateVacancies } from "../hooks/useBulkDuplicateVacancies";

interface BulkDuplicateVacanciesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds?: string[];
  vacancyIds?: string[];
  onCompleted?: () => void;
}

export function BulkDuplicateVacanciesDialog({
  open,
  onOpenChange,
  selectedIds,
  vacancyIds,
  onCompleted,
}: BulkDuplicateVacanciesDialogProps) {
  const mutation = useBulkDuplicateVacancies();
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
            ¿Duplicar {ids.length} vacante{ids.length === 1 ? "" : "s"}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Se crearán copias de las vacantes seleccionadas con estado inicial.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancelar</AlertDialogCancel>
          <Button asChild>
            <AlertDialogAction disabled={mutation.isPending} onClick={handleConfirm}>
              {mutation.isPending ? "Duplicando..." : "Duplicar"}
            </AlertDialogAction>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
