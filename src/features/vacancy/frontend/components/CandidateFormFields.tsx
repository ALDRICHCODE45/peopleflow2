"use client";

import { Input } from "@shadcn/input";
import { Textarea } from "@shadcn/textarea";
import { Switch } from "@shadcn/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/select";
import { Field, FieldLabel, FieldError } from "@/core/shared/ui/shadcn/field";
import { Separator } from "@/core/shared/ui/shadcn/separator";
import { CurrencyInput } from "@/core/shared/components/CurrencyInput";
import { PhoneInput } from "@/core/shared/components/phone-input";
import CountrySelect from "@/core/shared/components/CountrySelect";
import RegionSelect from "@/core/shared/components/RegionSelect";
import {
  VACANCY_MODALITY_LABELS,
  type VacancyModality,
} from "../types/vacancy.types";
import type { CandidateForm } from "../types/candidate-form.types";

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="space-y-1 mb-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <Separator />
    </div>
  );
}

export interface CandidateFormFieldsProps {
  form: CandidateForm;
}

export function CandidateFormFields({ form }: CandidateFormFieldsProps) {
  return (
    <div className="space-y-6">
      {/* ── Sección 1: Datos personales ─────────────────────── */}
      <div>
        <SectionHeader title="Datos personales" />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <form.Field name="firstName">
              {(field) => {
                const hasError =
                  field.state.meta.isTouched && !field.state.value?.trim();
                return (
                  <Field data-invalid={hasError}>
                    <FieldLabel>
                      Nombre <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      placeholder="Juan"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={hasError}
                    />
                    {hasError && (
                      <FieldError>El nombre es requerido</FieldError>
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="lastName">
              {(field) => {
                const hasError =
                  field.state.meta.isTouched && !field.state.value?.trim();
                return (
                  <Field data-invalid={hasError}>
                    <FieldLabel>
                      Apellido <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      placeholder="García"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={hasError}
                    />
                    {hasError && (
                      <FieldError>El apellido es requerido</FieldError>
                    )}
                  </Field>
                );
              }}
            </form.Field>
          </div>

          <form.Field name="email">
            {(field) => (
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  placeholder="juan@ejemplo.com"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="phone">
            {(field) => (
              <Field>
                <FieldLabel>Teléfono</FieldLabel>
                <PhoneInput
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val)}
                  defaultCountry="MX"
                />
              </Field>
            )}
          </form.Field>
        </div>
      </div>

      {/* ── Sección 2: Situación laboral ────────────────────── */}
      <div>
        <SectionHeader title="Situación laboral" />
        <div className="space-y-4">
          <form.Field name="isCurrentlyEmployed">
            {(field) => (
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm">¿Actualmente empleado?</span>
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(v) => field.handleChange(v)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="currentCompany">
            {(field) => (
              <Field>
                <FieldLabel>Empresa actual o última</FieldLabel>
                <Input
                  placeholder="Nombre de la empresa"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="currentModality">
            {(field) => (
              <Field>
                <FieldLabel>Modalidad actual o última</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(v) =>
                    field.handleChange(v as VacancyModality | "")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar modalidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(VACANCY_MODALITY_LABELS) as [
                        VacancyModality,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-3">
            <form.Field name="currentCountryCode">
              {(field) => (
                <Field>
                  <FieldLabel>País (trabajo actual o último)</FieldLabel>
                  <CountrySelect
                    value={field.state.value}
                    onChange={(val) => {
                      field.handleChange(val);
                      form.setFieldValue("currentRegionCode", "");
                    }}
                    priorityOptions={["MX"]}
                    placeholder="Seleccionar país"
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="currentRegionCode">
              {(field) => (
                <Field>
                  <FieldLabel>Estado/Ciudad (trabajo actual o último)</FieldLabel>
                  <RegionSelect
                    value={field.state.value}
                    countryCode={form.getFieldValue("currentCountryCode")}
                    onChange={(val) => field.handleChange(val)}
                    placeholder="Seleccionar estado"
                  />
                </Field>
              )}
            </form.Field>
          </div>

          <form.Field name="workCity">
            {(field) => (
              <Field>
                <FieldLabel>Municipio o zona</FieldLabel>
                <Input
                  placeholder="Ej. Tecámac, Polanco, San Pedro Garza..."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>
        </div>
      </div>

      {/* ── Sección 3: Compensación ──────────────────────────── */}
      <div>
        <SectionHeader title="Compensación" />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <form.Field name="currentSalary">
              {(field) => (
                <Field>
                  <FieldLabel>Sueldo actual o último (bruto)</FieldLabel>
                  <CurrencyInput
                    value={field.state.value}
                    onChange={(value) => field.handleChange(value)}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="salaryExpectation">
              {(field) => (
                <Field>
                  <FieldLabel>Expectativa económica (bruto)</FieldLabel>
                  <CurrencyInput
                    value={field.state.value}
                    onChange={(value) => field.handleChange(value)}
                  />
                </Field>
              )}
            </form.Field>
          </div>

          <form.Field name="currentCommissions">
            {(field) => (
              <Field>
                <FieldLabel>Bonos / Comisiones (Últimas o Actuales)</FieldLabel>
                <Textarea
                  placeholder="Ej. 10% comisión, bono anual..."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={2}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="currentBenefits">
            {(field) => (
              <Field>
                <FieldLabel>Prestaciones actuales o últimas</FieldLabel>
                <Textarea
                  placeholder="Describe prestaciones (vales, SGMM, vacaciones, etc.)"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={2}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="otherBenefits">
            {(field) => (
              <Field>
                <FieldLabel>Otros beneficios esperados</FieldLabel>
                <Textarea
                  placeholder="Otros beneficios que espera recibir..."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={2}
                />
              </Field>
            )}
          </form.Field>
        </div>
      </div>

      {/* ── Sección 4: Ubicación del candidato ──────────────── */}
      <div>
        <SectionHeader title="Ubicación del candidato" />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <form.Field name="candidateCountryCode">
              {(field) => (
                <Field>
                  <FieldLabel>País de residencia</FieldLabel>
                  <CountrySelect
                    value={field.state.value}
                    onChange={(val) => {
                      field.handleChange(val);
                      form.setFieldValue("candidateRegionCode", "");
                    }}
                    priorityOptions={["MX"]}
                    placeholder="Seleccionar país"
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="candidateRegionCode">
              {(field) => (
                <Field>
                  <FieldLabel>Estado/Ciudad de residencia</FieldLabel>
                  <RegionSelect
                    value={field.state.value}
                    countryCode={form.getFieldValue("candidateCountryCode")}
                    onChange={(val) => field.handleChange(val)}
                    placeholder="Seleccionar estado"
                  />
                </Field>
              )}
            </form.Field>
          </div>

          <form.Field name="candidateCity">
            {(field) => (
              <Field>
                <FieldLabel>Municipio o zona</FieldLabel>
                <Input
                  placeholder="Ej. Tecámac, Polanco, San Pedro Garza..."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>
        </div>
      </div>
    </div>
  );
}
