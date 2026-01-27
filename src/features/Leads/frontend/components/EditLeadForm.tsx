"use client";

import { Button } from "@/core/shared/ui/shadcn/button";
import { Input } from "@/core/shared/ui/shadcn/input";
import { Textarea } from "@/core/shared/ui/shadcn/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/shared/ui/shadcn/select";
import { Field, FieldError, FieldLabel } from "@/core/shared/ui/shadcn/field";
import { useEditLeadForm } from "../hooks/useEditLeadForm";
import type { Lead } from "../types";
import { LEAD_STATUS_OPTIONS } from "../types";

interface EditLeadFormProps {
  lead: Lead;
  onOpenChange: (open: boolean) => void;
}

export function EditLeadForm({ lead, onOpenChange }: EditLeadFormProps) {
  const {
    form,
    sectors,
    subsectors,
    origins,
    selectedSectorId,
    handleSectorChange,
    isSubmitting,
  } = useEditLeadForm({ lead, onOpenChange });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      {/* Nombre de la empresa */}
      <form.Field name="companyName">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Nombre de la empresa *
              </FieldLabel>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Nombre de la empresa"
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      {/* RFC */}
      <form.Field name="rfc">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>RFC</FieldLabel>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="RFC de la empresa"
                maxLength={13}
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      {/* Estado */}
      <form.Field name="status">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Estado</FieldLabel>
            <Select
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      </form.Field>

      {/* Sector y Subsector */}
      <div className="grid grid-cols-2 gap-4">
        <form.Field name="sectorId">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Sector</FieldLabel>
              <Select
                value={field.state.value ?? "none"}
                onValueChange={(value) =>
                  handleSectorChange(value === "none" ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin sector</SelectItem>
                  {sectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        <form.Field name="subsectorId">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Subsector</FieldLabel>
              <Select
                value={field.state.value ?? "none"}
                onValueChange={(value) =>
                  field.handleChange(value === "none" ? undefined : value)
                }
                disabled={!selectedSectorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un subsector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin subsector</SelectItem>
                  {subsectors.map((subsector) => (
                    <SelectItem key={subsector.id} value={subsector.id}>
                      {subsector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>
      </div>

      {/* Origen */}
      <form.Field name="originId">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Origen del lead</FieldLabel>
            <Select
              value={field.state.value ?? "none"}
              onValueChange={(value) =>
                field.handleChange(value === "none" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin origen</SelectItem>
                {origins.map((origin) => (
                  <SelectItem key={origin.id} value={origin.id}>
                    {origin.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      </form.Field>

      {/* Website */}
      <form.Field name="website">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Sitio web</FieldLabel>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="https://ejemplo.com"
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

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
                placeholder="https://linkedin.com/company/..."
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      {/* Direccion */}
      <form.Field name="address">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Direccion</FieldLabel>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Direccion de la empresa"
            />
          </Field>
        )}
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
              placeholder="Notas adicionales sobre el lead..."
              rows={3}
            />
          </Field>
        )}
      </form.Field>

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
