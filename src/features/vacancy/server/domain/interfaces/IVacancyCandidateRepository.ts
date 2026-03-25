import type {
  VacancyModality,
  CandidateStatus,
} from "@features/vacancy/frontend/types/vacancy.types";
import type { VacancyCandidate } from "../entities/VacancyCandidate";

export interface CreateCandidateData {
  vacancyId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  isCurrentlyEmployed?: boolean | null;
  currentCompany?: string | null;
  currentSalary?: number | null;
  salaryExpectation?: number | null;
  currentModality?: VacancyModality | null;
  countryCode?: string | null;
  regionCode?: string | null;
  workCity?: string | null;
  candidateCountryCode?: string | null;
  candidateRegionCode?: string | null;
  candidateCity?: string | null;
  currentCommissions?: string | null;
  currentBenefits?: string | null;
  otherBenefits?: string | null;
  tenantId: string;
}

export interface UpdateCandidateData {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  isCurrentlyEmployed?: boolean | null;
  currentCompany?: string | null;
  currentSalary?: number | null;
  salaryExpectation?: number | null;
  currentModality?: VacancyModality | null;
  countryCode?: string | null;
  regionCode?: string | null;
  workCity?: string | null;
  candidateCountryCode?: string | null;
  candidateRegionCode?: string | null;
  candidateCity?: string | null;
  currentCommissions?: string | null;
  currentBenefits?: string | null;
  otherBenefits?: string | null;
  status?: CandidateStatus;
  isInTerna?: boolean;
  isFinalist?: boolean;
  finalSalary?: number | null;
}

export interface IVacancyCandidateRepository {
  findById(id: string, tenantId: string): Promise<VacancyCandidate | null>;
  findByVacancyId(
    vacancyId: string,
    tenantId: string
  ): Promise<VacancyCandidate[]>;
  findTernaByVacancyId(
    vacancyId: string,
    tenantId: string
  ): Promise<VacancyCandidate[]>;
  create(data: CreateCandidateData): Promise<VacancyCandidate>;
  update(
    id: string,
    tenantId: string,
    data: UpdateCandidateData
  ): Promise<VacancyCandidate | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  markAsInTerna(
    ids: string[],
    vacancyId: string,
    tenantId: string
  ): Promise<number>;
  clearTerna(vacancyId: string, tenantId: string): Promise<number>;
  /**
   * Marks one candidate as CONTRATADO (isInTerna: false) and sets all other
   * candidates in the same vacancy to DESCARTADO in a single transaction.
   */
  markAsContratado(
    id: string,
    vacancyId: string,
    tenantId: string
  ): Promise<void>;
  /**
   * Resets all candidates in a vacancy to EN_PROCESO and clears isInTerna.
   * Called when a vacancy rolls back to HUNTING from any forward state.
   */
  resetCandidatesOnRollback(vacancyId: string, tenantId: string): Promise<void>;
  /**
   * Marks all candidates in the vacancy whose IDs are NOT in ternaIds as DESCARTADO.
   * Called after markAsInTerna to auto-discard non-terna candidates.
   */
  markNonTernaAsDescartado(
    vacancyId: string,
    tenantId: string,
    ternaIds: string[]
  ): Promise<void>;
}
