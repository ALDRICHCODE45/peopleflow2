"use client";

import { Button } from "@/core/shared/ui/shadcn/button";
import { Input } from "@/core/shared/ui/shadcn/input";
import { Textarea } from "@/core/shared/ui/shadcn/textarea";
import { Switch } from "@/core/shared/ui/shadcn/switch";
import { PhoneInput } from "@/core/shared/components/phone-input";
import { CreatableSelect } from "@/core/shared/components/CreatableSelect";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/core/shared/ui/shadcn/field";
import { Label } from "@/core/shared/ui/shadcn/label";
import { useCreateContactForm } from "../../hooks/useCreateContactForm";
import { CONTACT_POSITION_OPTIONS } from "../../types";

interface CreateContactFormProps {
  leadId: string;
  onOpenChange: (open: boolean) => void;
}

export function CreateContactForm({
  leadId,
  onOpenChange,
}: CreateContactFormProps) {
  const { form, isSubmitting } = useCreateContactForm({ leadId, onOpenChange });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      {/* Nombre y Apellido */}
      <div className="grid grid-cols-2 gap-4">
        <form.Field name="firstName">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Nombre *</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Nombre"
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="lastName">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Apellido *</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Apellido"
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </div>

      {/* Puesto */}
      <form.Field name="position">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Puesto</FieldLabel>
            <CreatableSelect
              options={CONTACT_POSITION_OPTIONS}
              value={field.state.value}
              onChange={(val) => field.handleChange(val)}
              onBlur={field.handleBlur}
              placeholder="Seleccionar puesto..."
              searchPlaceholder="Buscar puesto..."
              createLabel="Agregar"
            />
          </Field>
        )}
      </form.Field>

      {/* Email y Teléfono */}
      <div className="grid grid-cols-2 gap-4">
        <form.Field name="email">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                id={field.name}
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="email@ejemplo.com"
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="phone">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Telefono</FieldLabel>
              <PhoneInput
                value={field.state.value}
                onChange={(val) => field.handleChange(val)}
                defaultCountry="MX"
              />
            </Field>
          )}
        </form.Field>
      </div>

      {/* LinkedIn */}
      <form.Field name="linkedInUrl">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>LinkedIn</FieldLabel>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      {/* Notas */}
      <form.Field name="notes">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Notas</FieldLabel>
            <Textarea
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Notas sobre el contacto..."
              rows={2}
            />
          </Field>
        )}
      </form.Field>

      {/* Contacto principal */}
      <form.Field name="isPrimary">
        {(field) => (
          <Field orientation="horizontal">
            <Switch
              id={field.name}
              checked={field.state.value}
              onCheckedChange={(checked) => field.handleChange(checked)}
            />
            <Label
              htmlFor={field.name}
              className="text-sm font-normal cursor-pointer"
            >
              Contacto principal
            </Label>
          </Field>
        )}
      </form.Field>

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar contacto"}
        </Button>
      </div>
    </form>
  );
}
