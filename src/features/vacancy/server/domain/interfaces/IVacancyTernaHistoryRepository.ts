import type { VacancyTernaHistory } from "../entities/VacancyTernaHistory";

export interface CreateTernaHistoryData {
  vacancyId: string;
  ternaNumber: number;
  validatedById: string;
  /** If omitted, Prisma default `now()` applies */
  validatedAt?: Date;
  targetDeliveryDate: Date | null;
  isOnTime: boolean;
  tenantId: string;
  candidates: { candidateId: string; candidateFullName: string }[];
}

export interface IVacancyTernaHistoryRepository {
  create(data: CreateTernaHistoryData): Promise<VacancyTernaHistory>;
  findByVacancyId(vacancyId: string, tenantId: string): Promise<VacancyTernaHistory[]>;
  countByVacancyId(vacancyId: string, tenantId: string): Promise<number>;
}
