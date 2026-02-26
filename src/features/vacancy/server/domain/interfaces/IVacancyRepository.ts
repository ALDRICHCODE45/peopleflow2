import type {
  VacancyStatusType,
  VacancySaleType,
  VacancyModality,
} from "@features/vacancy/frontend/types/vacancy.types";
import type { Vacancy } from "../entities/Vacancy";

export interface CreateVacancyData {
  position: string;
  recruiterId: string;
  clientId: string;
  saleType: VacancySaleType;
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
  recruiterId?: string;
  clientId?: string;
  countryCode?: string;
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
}
