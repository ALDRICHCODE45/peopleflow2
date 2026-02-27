"use client";

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

interface DeleteCandidateAlertDialogProps {
  isOpen: boolean;
  onOpenChange: () => void;
  candidateNameToDelete?: string;
  onConfirmDelete?: () => void;
  isLoading?: boolean;
}

export function DeleteCandidateAlertDialog({
  isOpen,
  onOpenChange,
  candidateNameToDelete,
  onConfirmDelete,
  isLoading = false,
}: DeleteCandidateAlertDialogProps) {
  const [inputValue, setInputValue] = useState("");

  const isMatch = inputValue.trim() === candidateNameToDelete;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Estás seguro que deseas eliminar este candidato?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción <b>no se puede deshacer</b>. Para confirmar, por favor
            escribe <b>{candidateNameToDelete}</b> debajo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-3">
          <Input
            autoFocus
            placeholder="Escribe el nombre del candidato"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            data-testid="delete-candidate-confirm-input"
          />
          {!isMatch && inputValue.length > 0 && (
            <span className="text-xs text-red-500 mt-1 block">
              El nombre no coincide.
            </span>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <Button asChild variant="destructive">
            <AlertDialogAction
              disabled={!isMatch || isLoading}
              onClick={onConfirmDelete}
              data-testid="delete-candidate-confirm-btn"
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
