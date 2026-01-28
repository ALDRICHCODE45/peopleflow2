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
import { Input } from "@/core/shared/ui/shadcn/input";
import { useState } from "react";

interface DeleteLeadAlertDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  leadName: string;
  isLoading?: boolean;
}

export function DeleteLeadAlertDialog({
  isOpen,
  onOpenChange,
  onConfirmDelete,
  leadName,
  isLoading = false,
}: DeleteLeadAlertDialogProps) {
  const [inputValue, setInputValue] = useState("");

  const isMatch = inputValue.trim() === leadName;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Estás seguro que deseas eliminar este Lead?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción <b>no se puede deshacer</b>. Para confirmar, por favor
            escribe <b>{leadName}</b> debajo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-3">
          <Input
            autoFocus
            placeholder="Escribe el nombre de lead"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            data-testid="delete-lead-confirm-input"
          />
          {!isMatch && inputValue.length > 0 && (
            <span className="text-xs text-red-500 mt-1 block">
              El nombre no coincide.
            </span>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <Button asChild variant={"destructive"}>
            <AlertDialogAction
              disabled={!isMatch || isLoading}
              onClick={onConfirmDelete}
              data-testid="delete-lead-confirm-btn"
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
