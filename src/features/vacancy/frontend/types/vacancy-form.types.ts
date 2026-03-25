import type {
  VacancyServiceType,
  VacancyModality,
  VacancySalaryType,
  VacancyCurrency,
} from "./vacancy.types";
import type { useCreateVacancyForm } from "../hooks/useCreateVacancyForm";

/**
 * Canonical shape of the vacancy form values.
 * Both useCreateVacancyForm and useEditVacancyForm use
 * `defaultValues satisfies VacancyFormValues` so TanStack Form
 * infers TFormData correctly without unsafe `as` casts.
 */
export interface VacancyFormValues {
  position: string;
  recruiterId: string;
  clientId: string;
  serviceType: VacancyServiceType | "";
  currency: VacancyCurrency | "";
  assignedAt: string;
  targetDeliveryDate: string;
  salaryType: VacancySalaryType;
  salaryFixed: number | undefined;
  salaryMin: number | undefined;
  salaryMax: number | undefined;
  benefits: string;
  tools: string;
  commissions: string;
  modality: VacancyModality | undefined;
  schedule: string;
  countryCode: string;
  regionCode: string;
  requiresPsychometry: boolean;
}

/**
 * The concrete form instance type for vacancy forms.
 * Derived from useCreateVacancyForm's return type — now properly
 * typed because the hook uses `satisfies VacancyFormValues`.
 *
 * We use ReturnType extraction instead of manually specifying 12
 * TanStack Form generics (ReactFormExtendedApi<...>).
 */
export type VacancyForm = ReturnType<typeof useCreateVacancyForm>["form"];

/**
 * Validation errors for required fields that live inside the "Detalles" modal
 * or the checklist tab. These are checked on submit attempt.
 */
export interface VacancyFormValidationErrors {
  currency?: string;
  salary?: string;
  benefits?: string;
  tools?: string;
  modality?: string;
  checklist?: string;
}

/** The two tab values used in the vacancy form tabs. */
export type VacancyFormTab = "basic" | "checklist";
