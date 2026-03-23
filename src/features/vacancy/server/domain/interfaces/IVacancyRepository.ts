import type {
  VacancyStatusType,
  VacancySaleType,
  VacancyServiceType,
  VacancyModality,
  VacancyCurrency,
  VacancySalaryType,
} from "@features/vacancy/frontend/types/vacancy.types";
import type { Vacancy } from "../entities/Vacancy";

export interface CreateVacancyData {
  position: string;
  recruiterId: string;
  clientId: string;
  saleType: VacancySaleType;
  serviceType: VacancyServiceType;
  currency?: VacancyCurrency | null;
  assignedAt?: Date;
  salaryType?: "FIXED" | "RANGE";
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryFixed?: number | null;
  commissions?: string | null;
  benefits?: string | null;
  tools?: string | null;
  modality?: VacancyModality | null;
  schedule?: string | null;
  countryCode?: string | null;
  regionCode?: string | null;
  requiresPsychometry?: boolean;
  targetDeliveryDate?: Date | null;
  tenantId: string;
  createdById?: string | null;
}

export interface UpdateVacancyData {
  position?: string;
  recruiterId?: string;
  serviceType?: VacancyServiceType;
  currency?: VacancyCurrency | null;
  assignedAt?: Date;
  currentCycleStartedAt?: Date;
  salaryType?: "FIXED" | "RANGE";
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryFixed?: number | null;
  commissions?: string | null;
  benefits?: string | null;
  tools?: string | null;
  modality?: VacancyModality | null;
  schedule?: string | null;
  countryCode?: string | null;
  regionCode?: string | null;
  requiresPsychometry?: boolean;
  targetDeliveryDate?: Date | null;
  actualDeliveryDate?: Date | null;
  entryDate?: Date | null;
  rollbackCount?: number;
  placementConfirmedAt?: Date | null;
  commissionDate?: Date | null;
  congratsEmailSent?: boolean;
  status?: VacancyStatusType;
  checklistValidatedAt?: Date | null;
  checklistValidatedById?: string | null;
  checklistRejectionReason?: string | null;
}

export interface FindVacanciesFilters {
  statuses?: VacancyStatusType[];
  saleTypes?: VacancySaleType[];
  serviceTypes?: VacancyServiceType[];
  modalities?: VacancyModality[];
  recruiterIds?: string[];
  clientIds?: string[];
  countryCodes?: string[];
  regionCodes?: string[];
  requiresPsychometry?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  assignedAtFrom?: string;
  assignedAtTo?: string;
  targetDeliveryDateFrom?: string;
  targetDeliveryDateTo?: string;
  search?: string;
}

export interface FindPaginatedVacanciesParams {
  tenantId: string;
  skip: number;
  take: number;
  sorting?: { id: string; desc: boolean }[];
  filters?: FindVacanciesFilters;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
}

export interface CreateWarrantyVacancyData {
  originVacancyId: string;
  position: string;
  recruiterId: string;
  recruiterName?: string | null;
  clientId: string;
  saleType: VacancySaleType;
  serviceType: VacancyServiceType;
  currency?: VacancyCurrency | null;
  salaryType?: VacancySalaryType;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryFixed?: number | null;
  commissions?: string | null;
  benefits?: string | null;
  tools?: string | null;
  modality?: VacancyModality | null;
  schedule?: string | null;
  countryCode?: string | null;
  regionCode?: string | null;
  requiresPsychometry?: boolean;
  targetDeliveryDate?: Date | null;
  tenantId: string;
  createdById: string | null;
  createdByName?: string | null;
}

export interface ChecklistValidationResult {
  id: string;
  checklistValidatedAt: string | null;
  checklistValidatedById: string | null;
  checklistRejectionReason: string | null;
}

export interface IVacancyRepository {
  findById(id: string, tenantId: string): Promise<Vacancy | null>;
  findByTenantId(
    tenantId: string,
    filters?: FindVacanciesFilters
  ): Promise<Vacancy[]>;
  findByClientId(clientId: string, tenantId: string): Promise<Vacancy[]>;
  create(data: CreateVacancyData): Promise<Vacancy>;
  update(
    id: string,
    tenantId: string,
    data: UpdateVacancyData
  ): Promise<Vacancy | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  count(tenantId: string, filters?: FindVacanciesFilters): Promise<number>;
  findPaginated(
    params: FindPaginatedVacanciesParams
  ): Promise<PaginatedResult<Vacancy>>;
  countByClientId(clientId: string, tenantId: string): Promise<number>;
  findRecruiterContactById(userId: string): Promise<{ email: string; name: string | null } | null>;
  findClientNameById(clientId: string, tenantId: string): Promise<string | null>;
  validateChecklist(vacancyId: string, tenantId: string, validatedById: string): Promise<ChecklistValidationResult>;
  rejectChecklist(vacancyId: string, tenantId: string, reason: string): Promise<ChecklistValidationResult>;
  findByOriginVacancyId(originVacancyId: string, tenantId: string): Promise<Vacancy | null>;
  createWarrantyVacancy(data: CreateWarrantyVacancyData): Promise<Vacancy>;
}
