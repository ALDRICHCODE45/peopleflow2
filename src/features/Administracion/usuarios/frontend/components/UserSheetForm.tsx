"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/shared/ui/shadcn/select";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import { useUserSheetForm } from "../hooks/useUserSheetForm";
import type { TenantUser } from "../types";
import { Field, FieldError, FieldLabel } from "@/core/shared/ui/shadcn/field";
import { AvatarPicker } from "./AvatarPicker";

interface UserSheetFormProps {
  user?: TenantUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserSheetForm({
  user,
  open,
  onOpenChange,
}: UserSheetFormProps) {
  const isMobile = useIsMobile();
  const sheetSide = isMobile ? "bottom" : "right";

  const { form, roles, isEditing, isSubmitting } = useUserSheetForm({
    user,
    onOpenChange,
  });

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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4 p-4"
        >
          {/* Avatar Picker */}
          <div className="flex flex-col items-center gap-3 pb-2">
            <form.Field name="avatar">
              {(field) => (
                <AvatarPicker
                  currentAvatar={field.state.value}
                  onAvatarChange={field.handleChange}
                />
              )}
            </form.Field>
            <p className="text-xs text-muted-foreground">
              Haz clic para elegir un avatar
            </p>
          </div>

          {/* Email Field */}
          <form.Field name="email">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Email *</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          {/* Name Field */}
          <form.Field name="name">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Nombre {!isEditing && "*"}
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Nombre completo"
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          {/* Password + Role (only when creating) */}
          {!isEditing && (
            <>
              <form.Field name="password">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Contraseña *</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="roleId">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Rol inicial</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                    >
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
                  </Field>
                )}
              </form.Field>
            </>
          )}

          <SheetFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
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
