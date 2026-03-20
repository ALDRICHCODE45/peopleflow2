"use client";

import { Input } from "@shadcn/input";
import { Field, FieldLabel } from "@/core/shared/ui/shadcn/field";
import { useStore } from "@tanstack/react-form";
import { VACANCY_SALARY_TYPE_LABELS } from "../types/vacancy.types";
import type { VacancySalaryType } from "../types/vacancy.types";
import type { VacancyForm } from "../types/vacancy-form.types";

interface SalaryFieldsProps {
  form: VacancyForm;
}

export function SalaryFields({ form }: SalaryFieldsProps) {
  const salaryType = useStore(
    form.store,
    (s) => s.values.salaryType as VacancySalaryType,
  );

  if (salaryType === "FIXED") {
    return (
      <form.Field name="salaryFixed">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>
              {VACANCY_SALARY_TYPE_LABELS.FIXED}
            </FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <Input
                id={field.name}
                type="number"
                className="pl-7"
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                placeholder="0"
              />
            </div>
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
            <Input
              id={field.name}
              type="number"
              value={field.state.value ?? ""}
              onBlur={field.handleBlur}
              onChange={(e) =>
                field.handleChange(
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              placeholder="0"
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="salaryMax">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Salario máximo</FieldLabel>
            <Input
              id={field.name}
              type="number"
              value={field.state.value ?? ""}
              onBlur={field.handleBlur}
              onChange={(e) =>
                field.handleChange(
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              placeholder="0"
            />
          </Field>
        )}
      </form.Field>
    </div>
  );
}
