"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/core/shared/ui/shadcn/sheet";
import { Button } from "@/core/shared/ui/shadcn/button";
import { Input } from "@/core/shared/ui/shadcn/input";
import { Label } from "@/core/shared/ui/shadcn/label";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import { useCreateRole, useUpdateRole } from "../hooks/useRoles";
import type { RoleWithStats } from "../types";

interface RoleSheetFormProps {
  role?: RoleWithStats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleSheetForm({ role, open, onOpenChange }: RoleSheetFormProps) {
  const isEditing = !!role;
  const isMobile = useIsMobile();
  const sheetSide = isMobile ? "bottom" : "right";

  const [name, setName] = useState("");

  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();

  useEffect(() => {
    if (role) {
      setName(role.name);
    } else {
      setName("");
    }
  }, [role, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      await updateRoleMutation.mutateAsync({
        roleId: role.id,
        name,
      });
    } else {
      await createRoleMutation.mutateAsync(name);
    }

    onOpenChange(false);
  };

  const isLoading = createRoleMutation.isPending || updateRoleMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        width="md"
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B]"
        side={sheetSide}
      >
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar Rol" : "Nuevo Rol"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Modifica el nombre del rol"
              : "Ingresa el nombre para crear un nuevo rol"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Rol *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej: gerente-ventas"
              required
              minLength={2}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Usa un nombre descriptivo en minúsculas
            </p>
          </div>

          <SheetFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Guardando..."
                : isEditing
                  ? "Guardar Cambios"
                  : "Crear Rol"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
