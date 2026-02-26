import type { VacancyStatusType } from "@features/vacancy/frontend/types/vacancy.types";

export interface CreateStatusHistoryData {
  vacancyId: string;
  previousStatus: VacancyStatusType;
  newStatus: VacancyStatusType;
  isRollback: boolean;
  reason?: string | null;
  newTargetDeliveryDate?: Date | null;
  changedById: string;
  tenantId: string;
}

export interface VacancyStatusHistoryEntry {
  id: string;
  vacancyId: string;
  previousStatus: VacancyStatusType;
  newStatus: VacancyStatusType;
  isRollback: boolean;
  reason: string | null;
  newTargetDeliveryDate: Date | null;
  changedById: string;
  changedByName?: string | null;
  tenantId: string;
  createdAt: Date;
}

export interface IVacancyStatusHistoryRepository {
  create(data: CreateStatusHistoryData): Promise<VacancyStatusHistoryEntry>;
  findByVacancyId(
    vacancyId: string,
    tenantId: string
  ): Promise<VacancyStatusHistoryEntry[]>;
}
