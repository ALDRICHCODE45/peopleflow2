export interface UpsertVacancyConfigData {
  quickMeetingSlaHours?: number;
  requirePhone?: boolean;
  requireEmail?: boolean;
  requireIsCurrentlyEmployed?: boolean;
  requireCurrentCompany?: boolean;
  requireCurrentSalary?: boolean;
  requireSalaryExpectation?: boolean;
  requireCurrentModality?: boolean;
  requireCurrentLocation?: boolean;
  requireCurrentCommissions?: boolean;
  requireCurrentBenefits?: boolean;
  requireCandidateLocation?: boolean;
  requireOtherBenefits?: boolean;
  requireCv?: boolean;
}

/** Para esta interfaz, VacancyConfig es un objeto plano (no entidad de dominio completa) */
export interface VacancyConfigData {
  id: string;
  tenantId: string;
  quickMeetingSlaHours: number;
  requirePhone: boolean;
  requireEmail: boolean;
  requireIsCurrentlyEmployed: boolean;
  requireCurrentCompany: boolean;
  requireCurrentSalary: boolean;
  requireSalaryExpectation: boolean;
  requireCurrentModality: boolean;
  requireCurrentLocation: boolean;
  requireCurrentCommissions: boolean;
  requireCurrentBenefits: boolean;
  requireCandidateLocation: boolean;
  requireOtherBenefits: boolean;
  requireCv: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVacancyConfigRepository {
  findByTenantId(tenantId: string): Promise<VacancyConfigData | null>;
  upsert(
    tenantId: string,
    data: UpsertVacancyConfigData
  ): Promise<VacancyConfigData>;
}
