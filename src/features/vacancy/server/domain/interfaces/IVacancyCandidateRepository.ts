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
  currentLocation?: string | null;
  currentCommissions?: string | null;
  currentBenefits?: string | null;
  candidateLocation?: string | null;
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
  currentLocation?: string | null;
  currentCommissions?: string | null;
  currentBenefits?: string | null;
  candidateLocation?: string | null;
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
}
