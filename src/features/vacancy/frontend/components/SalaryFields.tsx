"use client";

import { Field, FieldLabel } from "@/core/shared/ui/shadcn/field";
import { CurrencyInput } from "@/core/shared/components/CurrencyInput";
import { useStore } from "@tanstack/react-form";
import { VACANCY_SALARY_TYPE_LABELS } from "../types/vacancy.types";
import type { VacancyForm } from "../types/vacancy-form.types";

interface SalaryFieldsProps {
  form: VacancyForm;
}

export function SalaryFields({ form }: SalaryFieldsProps) {
  const salaryType = useStore(form.store, (s) => s.values.salaryType);

  if (salaryType === "FIXED") {
    return (
      <form.Field name="salaryFixed">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>
              {VACANCY_SALARY_TYPE_LABELS.FIXED}
            </FieldLabel>
            <CurrencyInput
              id={field.name}
              value={field.state.value ?? ""}
              onBlur={field.handleBlur}
              onChange={(value) =>
                field.handleChange(
                  value ? Number(value) : undefined,
                )
              }
            />
          </Field>
        )}
      </form.Field>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <form.Field name="salaryMin">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Salario mínimo</FieldLabel>
            <CurrencyInput
              id={field.name}
              value={field.state.value ?? ""}
              onBlur={field.handleBlur}
              onChange={(value) =>
                field.handleChange(
                  value ? Number(value) : undefined,
                )
              }
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="salaryMax">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Salario máximo</FieldLabel>
            <CurrencyInput
              id={field.name}
              value={field.state.value ?? ""}
              onBlur={field.handleBlur}
              onChange={(value) =>
                field.handleChange(
                  value ? Number(value) : undefined,
                )
              }
            />
          </Field>
        )}
      </form.Field>
    </div>
  );
}
