"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shadcn/dialog";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import { Field, FieldLabel, FieldError } from "@shadcn/field";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@shadcn/avatar";
import { SearchableSelect } from "@/core/shared/components/SearchableSelect";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";
import { useCreateClient } from "../hooks/useCreateClient";

interface CreateClientDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateClientDialog({ open, onClose }: CreateClientDialogProps) {
  const [companyName, setCompanyName] = useState("");
  const [generadorId, setGeneradorId] = useState("");
  const [errors, setErrors] = useState<{ companyName?: string; generadorId?: string }>({});

  const { data: users = [] } = useTenantUsersQuery();
  const createClientMutation = useCreateClient();

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: u.name ?? u.email,
        avatar: u.avatar,
      })),
    [users],
  );

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!companyName.trim()) {
      newErrors.companyName = "El nombre del cliente es requerido";
    }

    if (!generadorId) {
      newErrors.generadorId = "El generador es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    await createClientMutation.mutateAsync(
      { companyName: companyName.trim(), generadorId },
      {
        onSuccess: () => {
          handleClose();
        },
      },
    );
  };

  const handleClose = () => {
    setCompanyName("");
    setGeneradorId("");
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Ingresa los datos del nuevo cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nombre del cliente */}
          <Field data-invalid={!!errors.companyName}>
            <FieldLabel htmlFor="companyName">
              Nombre del cliente *
            </FieldLabel>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                if (errors.companyName) setErrors((prev) => ({ ...prev, companyName: undefined }));
              }}
              placeholder="Nombre de la empresa"
              aria-invalid={!!errors.companyName}
            />
            {errors.companyName && (
              <FieldError>{errors.companyName}</FieldError>
            )}
          </Field>

          {/* Generador */}
          <Field data-invalid={!!errors.generadorId}>
            <FieldLabel htmlFor="generadorId">
              Generador *
            </FieldLabel>
            <SearchableSelect
              options={userOptions}
              value={generadorId}
              onChange={(v) => {
                setGeneradorId(v);
                if (errors.generadorId) setErrors((prev) => ({ ...prev, generadorId: undefined }));
              }}
              placeholder="Selecciona el generador"
              searchPlaceholder="Buscar usuario..."
              renderOption={(opt) => (
                <>
                  <Avatar className="size-6">
                    <AvatarImage src={opt.avatar ?? ""} />
                    <AvatarFallback className="text-xs">U</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{opt.label}</span>
                </>
              )}
              renderSelected={(opt) => (
                <span className="flex items-center gap-2 truncate">
                  <Avatar className="size-6">
                    <AvatarImage src={opt.avatar ?? ""} />
                    <AvatarFallback className="text-xs">U</AvatarFallback>
                  </Avatar>
                  {opt.label}
                </span>
              )}
            />
            {errors.generadorId && (
              <FieldError>{errors.generadorId}</FieldError>
            )}
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={createClientMutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createClientMutation.isPending}>
            {createClientMutation.isPending ? "Creando..." : "Crear cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
