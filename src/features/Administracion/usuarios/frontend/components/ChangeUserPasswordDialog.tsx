"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/shared/ui/shadcn/dialog";
import { Button } from "@/core/shared/ui/shadcn/button";
import { Input } from "@/core/shared/ui/shadcn/input";
import { Label } from "@/core/shared/ui/shadcn/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon } from "@hugeicons/core-free-icons";
import { useChangeUserPassword } from "../hooks/useUsers";
import type { TenantUser } from "../types";
import {
  PASSWORD_MIN,
  PASSWORD_MESSAGES,
  validatePassword,
} from "@features/Auth/frontend/schemas/passwordPolicy";

interface ChangeUserPasswordDialogProps {
  user: TenantUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeUserPasswordDialog({
  user,
  open,
  onOpenChange,
}: ChangeUserPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const changeMutation = useChangeUserPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Client-side validation
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setValidationError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError(PASSWORD_MESSAGES.mismatch);
      return;
    }

    try {
      await changeMutation.mutateAsync({
        userId: user.id,
        newPassword,
        confirmPassword,
      });
      // Reset form and close on success
      setNewPassword("");
      setConfirmPassword("");
      setValidationError(null);
      onOpenChange(false);
    } catch {
      // Error handled by mutation onError (toast)
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !changeMutation.isPending) {
      // Reset form when closing
      setNewPassword("");
      setConfirmPassword("");
      setValidationError(null);
    }
    onOpenChange(newOpen);
  };

  const isLoading = changeMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
          <DialogDescription>
            Cambiando la contraseña de {user.name || user.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Global password warning */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
              <HugeiconsIcon
                icon={Alert01Icon}
                className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0"
              />
              <div className="text-sm text-amber-900 dark:text-amber-100">
                <strong>Importante:</strong> Al cambiar la contraseña, se
                cerrarán todas las sesiones activas del usuario. Este cambio
                afecta el acceso en todos los tenants.
              </div>
            </div>

            {/* New password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder={`Mínimo ${PASSWORD_MIN} caracteres`}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                required
                minLength={PASSWORD_MIN}
              />
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repetí la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
                minLength={PASSWORD_MIN}
              />
            </div>

            {/* Validation error */}
            {validationError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                <p className="text-sm text-red-900 dark:text-red-100">
                  {validationError}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Cambiando..." : "Cambiar Contraseña"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
