"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/core/shared/ui/shadcn/button";
import { Input } from "@/core/shared/ui/shadcn/input";
import { Textarea } from "@/core/shared/ui/shadcn/textarea";
import { Field, FieldError, FieldLabel } from "@/core/shared/ui/shadcn/field";
import { DateTimePicker } from "@/core/shared/ui/shadcn/date-time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/shared/ui/shadcn/select";
import { useCreateInteractionForm } from "../../hooks/useCreateInteractionForm";
import { INTERACTION_TYPE_OPTIONS, INTERACTION_ICONS } from "../../types";
import type { Contact, InteractionType } from "../../types";

interface CreateInteractionFormProps {
  contacts: Contact[];
  fixedContactId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateInteractionForm({
  contacts,
  fixedContactId,
  onSuccess,
  onCancel,
}: CreateInteractionFormProps) {
  const { form, isSubmitting } = useCreateInteractionForm({
    fixedContactId,
    onSuccess,
  });

  const showContactSelector = !fixedContactId && contacts.length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <div
        className={showContactSelector ? "grid grid-cols-2 gap-4" : undefined}
      >
        {showContactSelector && (
          <form.Field name="contactId">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Contacto *</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v)}
                  >
                    <SelectTrigger onBlur={field.handleBlur}>
                      <SelectValue placeholder="Selecciona un contacto" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}
                          {c.isPrimary && " (Principal)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        )}

        <form.Field name="type">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Tipo *</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as InteractionType)}
              >
                <SelectTrigger onBlur={field.handleBlur}>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  {INTERACTION_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <HugeiconsIcon
                          icon={INTERACTION_ICONS[opt.value]}
                          className="size-4"
                        />
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>
      </div>

      <form.Field name="date">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel>Fecha y hora *</FieldLabel>
              <DateTimePicker
                value={field.state.value}
                onChange={(v) => field.handleChange(v)}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="subject">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Asunto *</FieldLabel>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Asunto de la interacción"
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="content">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Descripción</FieldLabel>
            <Textarea
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Detalles de la interacción..."
              rows={3}
            />
          </Field>
        )}
      </form.Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar interacción"}
        </Button>
      </div>
    </form>
  );
}
