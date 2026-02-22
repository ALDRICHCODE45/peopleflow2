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

interface BulkDeleteLeadsAlertDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  selectedCount: number;
  isLoading?: boolean;
}

const CONFIRM_KEYWORD = "ELIMINAR";

export function BulkDeleteLeadsAlertDialog({
  isOpen,
  onOpenChange,
  onConfirmDelete,
  selectedCount,
  isLoading = false,
}: BulkDeleteLeadsAlertDialogProps) {
  const [inputValue, setInputValue] = useState("");

  const isMatch = inputValue.trim() === CONFIRM_KEYWORD;

  const handleOpenChange = (open: boolean) => {
    if (!open) setInputValue("");
    onOpenChange(open);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Eliminar {selectedCount} lead{selectedCount !== 1 ? "s" : ""}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta accion <b>no se puede deshacer</b>. Vas a eliminar{" "}
            <b>
              {selectedCount} lead{selectedCount !== 1 ? "s" : ""}
            </b>
            . Para confirmar, escribe <b>{CONFIRM_KEYWORD}</b> debajo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-3">
          <Input
            autoFocus
            placeholder={`Escribe ${CONFIRM_KEYWORD} para confirmar`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          {!isMatch && inputValue.length > 0 && (
            <span className="text-xs text-red-500 mt-1 block">
              El texto no coincide.
            </span>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <Button asChild variant="destructive">
            <AlertDialogAction
              disabled={!isMatch || isLoading}
              onClick={onConfirmDelete}
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
