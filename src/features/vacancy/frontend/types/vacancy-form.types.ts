import type { useCreateVacancyForm } from "../hooks/useCreateVacancyForm";

/**
 * The concrete form instance type for vacancy forms.
 * Derived from the actual hook return type to stay in sync with validators.
 */
export type VacancyForm = ReturnType<typeof useCreateVacancyForm>["form"];
