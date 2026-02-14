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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/shared/ui/shadcn/avatar";
import { Field, FieldError, FieldLabel } from "@/core/shared/ui/shadcn/field";
import CountrySelect from "@/core/shared/components/CountrySelect";
import RegionSelect from "@/core/shared/components/RegionSelect";
import { SearchableSelect } from "@/core/shared/components/SearchableSelect";
import { useMemo } from "react";
import { useCreateLeadForm } from "../../hooks/useCreateLeadForm";
import { LEAD_EMPLOYEE_OPTIONS, LEAD_STATUS_OPTIONS } from "../../types";

interface CreateLeadFormProps {
  onOpenChange: (open: boolean) => void;
}

export function CreateLeadForm({ onOpenChange }: CreateLeadFormProps) {
  const {
    form,
    sectors,
    subsectors,
    origins,
    selectedSectorId,
    handleSectorChange,
    isSubmitting,
    users,
  } = useCreateLeadForm({ onOpenChange });

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: u.name ?? u.email,
        avatar: u.avatar,
      })),
    [users],
  );
  const sectorOptions = useMemo(
    () =>
      sectors.map((u) => ({
        value: u.id,
        label: u.name,
      })),
    [sectors],
  );
  const employeeOptions = useMemo(
    () =>
      LEAD_EMPLOYEE_OPTIONS.map((u) => ({
        value: u,
        label: u,
      })),
    [sectors],
  );

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

      {/* Estado del lead */}
      <form.Field name="status">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Estado del lead</FieldLabel>
            <Select
              value={field.state.value}
              onValueChange={(value) =>
                field.handleChange(value as typeof field.state.value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado" />
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

              <SearchableSelect
                options={sectorOptions}
                value={field.state.value}
                onChange={(v) => handleSectorChange(v)}
                placeholder="Selecciona el sector"
                searchPlaceholder="Buscar sector..."
                renderOption={(opt) => (
                  <>
                    <span className="truncate">{opt.label}</span>
                  </>
                )}
                renderSelected={(opt) => (
                  <div className="flex items-center">{opt.label}</div>
                )}
              />
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

      <div className="grid grid-cols-2 gap-4">
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

        {/* Sub-Origen */}
        <form.Field name="subOrigin">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Sub-Origen</FieldLabel>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="URL especifica, publicacion, etc."
              />
            </Field>
          )}
        </form.Field>
      </div>

      {/* Empleados */}
      <form.Field name="employeeCount">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Numero de empleados</FieldLabel>

            <SearchableSelect
              options={employeeOptions}
              value={field.state.value}
              onChange={(v) => field.handleChange(v)}
              placeholder="Selecciona el No. de empleados"
              searchPlaceholder="Buscar el No. de empleados..."
              renderOption={(opt) => (
                <>
                  <span className="truncate">{opt.label}</span>
                </>
              )}
              renderSelected={(opt) => (
                <div className="flex items-center">{opt.label}</div>
              )}
            />
          </Field>
        )}
      </form.Field>

      {/* Usuario asignado */}
      <form.Field name="assignedToId">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Usuario asignado *</FieldLabel>
              <SearchableSelect
                options={userOptions}
                value={field.state.value}
                onChange={(v) => field.handleChange(v)}
                placeholder="Selecciona el usuario"
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
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
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

      {/* Pais */}
      <form.Field name="countryCode">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Pais</FieldLabel>
            <CountrySelect
              className="w-full"
              value={field.state.value}
              onChange={(value) => {
                field.handleChange(value);
                form.setFieldValue("regionCode", "");
              }}
              priorityOptions={["MX"]}
              placeholder="Seleccionar pais"
            />
          </Field>
        )}
      </form.Field>

      {/* Region */}
      <form.Field name="regionCode">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Region</FieldLabel>
            <RegionSelect
              className="w-full"
              value={field.state.value}
              countryCode={form.getFieldValue("countryCode")}
              onChange={(value) => field.handleChange(value)}
              placeholder="Seleccionar region"
            />
          </Field>
        )}
      </form.Field>

      {/* Codigo Postal */}
      <form.Field name="postalCode">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Codigo Postal</FieldLabel>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Codigo postal"
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
          {isSubmitting ? "Creando..." : "Crear lead"}
        </Button>
      </div>
    </form>
  );
}
