"use client";

import { useState } from "react";
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/shared/ui/shadcn/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/shared/ui/shadcn/dialog";
import { Separator } from "@/core/shared/ui/shadcn/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/core/shared/ui/shadcn/tooltip";
import { Field, FieldError, FieldLabel } from "@/core/shared/ui/shadcn/field";
import { HugeiconsIcon } from "@hugeicons/react";
import { Camera01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

interface UserSheetFormProps {
  user?: TenantUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const avatarOptions = Array.from({ length: 19 }, (_, i) => ({
  id: String(i + 1),
  label: `Avatar ${i + 1}`,
  image: `/avatars/avatar${i + 1}.webp`,
}));

export function UserSheetForm({
  user,
  open,
  onOpenChange,
}: UserSheetFormProps) {
  const isMobile = useIsMobile();
  const sheetSide = isMobile ? "bottom" : "right";
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

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
                <Dialog
                  open={avatarDialogOpen}
                  onOpenChange={setAvatarDialogOpen}
                >
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Avatar className="size-20 ring-2 ring-border transition-all group-hover:ring-primary/50 group-hover:scale-105">
                        {field.state.value ? (
                          <AvatarImage
                            src={field.state.value}
                            alt="Avatar seleccionado"
                          />
                        ) : (
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            <HugeiconsIcon
                              icon={Camera01Icon}
                              className="size-6"
                            />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-110">
                        <HugeiconsIcon
                          icon={Camera01Icon}
                          className="size-3.5"
                        />
                      </span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Elige un avatar</DialogTitle>
                    </DialogHeader>
                    <Separator />
                    <div className="grid grid-cols-5 gap-3 py-2">
                      {avatarOptions.map((avatar) => {
                        const isSelected = field.state.value === avatar.image;
                        return (
                          <Tooltip key={avatar.id}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => {
                                  field.handleChange(avatar.image);
                                  setAvatarDialogOpen(false);
                                }}
                                className={`relative size-14 rounded-full p-1 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                  isSelected
                                    ? "ring-2 ring-primary scale-110"
                                    : "hover:ring-2 hover:ring-muted-foreground/30 hover:scale-105"
                                }`}
                              >
                                <Avatar className="size-full">
                                  <AvatarImage
                                    src={avatar.image}
                                    alt={avatar.label}
                                  />
                                  <AvatarFallback className="text-[10px]">
                                    {avatar.id}
                                  </AvatarFallback>
                                </Avatar>
                                {isSelected && (
                                  <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                                    <HugeiconsIcon
                                      icon={Tick02Icon}
                                      className="size-3"
                                    />
                                  </span>
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              {avatar.label}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                    {field.state.value && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mx-auto w-fit text-muted-foreground"
                        onClick={() => {
                          field.handleChange("");
                          setAvatarDialogOpen(false);
                        }}
                      >
                        Quitar avatar
                      </Button>
                    )}
                  </DialogContent>
                </Dialog>
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
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(formIsSubmitting) => (
                <Button
                  type="submit"
                  disabled={isSubmitting || formIsSubmitting}
                >
                  {isSubmitting || formIsSubmitting
                    ? "Guardando..."
                    : isEditing
                      ? "Guardar Cambios"
                      : "Crear Usuario"}
                </Button>
              )}
            </form.Subscribe>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
