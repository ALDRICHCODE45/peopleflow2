import type { VacancyModality } from "./vacancy.types";
import type { useAddCandidateForm } from "../hooks/useAddCandidateForm";

/**
 * Canonical shape of the candidate form values.
 * Both useAddCandidateForm and useEditCandidateForm use
 * `defaultValues satisfies CandidateFormValues` so TanStack Form
 * infers TFormData correctly without unsafe `as` casts.
 */
export interface CandidateFormValues {
  // Datos personales
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Situación laboral
  isCurrentlyEmployed: boolean;
  currentCompany: string;
  currentModality: VacancyModality | "";
  currentCountryCode: string;
  currentRegionCode: string;
  workCity: string;
  // Compensación
  currentSalary: string;
  salaryExpectation: string;
  currentCommissions: string;
  currentBenefits: string;
  otherBenefits: string;
  // Ubicación del candidato
  candidateCountryCode: string;
  candidateRegionCode: string;
  candidateCity: string;
}

/**
 * The concrete form instance type for candidate forms.
 * Derived from useAddCandidateForm's return type.
 */
export type CandidateForm = ReturnType<typeof useAddCandidateForm>["form"];
