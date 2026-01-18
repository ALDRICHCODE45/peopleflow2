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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/shared/ui/shadcn/select";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import { useCreateUser, useUpdateUser, useAvailableRolesQuery } from "../hooks/useUsers";
import type { TenantUser } from "../types";

interface UserSheetFormProps {
  user?: TenantUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserSheetForm({ user, open, onOpenChange }: UserSheetFormProps) {
  const isEditing = !!user;
  const isMobile = useIsMobile();
  const sheetSide = isMobile ? "bottom" : "right";

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<string>("");

  const { data: roles = [] } = useAvailableRolesQuery();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setName(user.name || "");
      setPassword("");
      setRoleId("");
    } else {
      setEmail("");
      setName("");
      setPassword("");
      setRoleId("");
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      await updateUserMutation.mutateAsync({
        userId: user.id,
        data: { name: name || undefined, email },
      });
    } else {
      await createUserMutation.mutateAsync({
        email,
        password,
        name: name,
        roleId: roleId || undefined,
      });
    }

    onOpenChange(false);
  };

  const isLoading = createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        width="lg"
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B]"
        side={sheetSide}
      >
        <SheetHeader>
          <SheetTitle>
            {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Modifica los datos del usuario"
              : "Completa los datos para crear un nuevo usuario"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
            />
          </div>

          {!isEditing && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol inicial</Label>
                <Select value={roleId} onValueChange={setRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

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
                  : "Crear Usuario"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
