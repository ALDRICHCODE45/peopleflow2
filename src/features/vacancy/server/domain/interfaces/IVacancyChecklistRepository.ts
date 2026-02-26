import type { VacancyChecklistItem } from "../entities/VacancyChecklistItem";

export interface CreateChecklistItemData {
  vacancyId: string;
  requirement: string;
  order?: number;
  tenantId: string;
}

export interface UpdateChecklistItemData {
  requirement?: string;
  isCompleted?: boolean;
  order?: number;
}

export interface IVacancyChecklistRepository {
  findById(
    id: string,
    tenantId: string
  ): Promise<VacancyChecklistItem | null>;
  findByVacancyId(
    vacancyId: string,
    tenantId: string
  ): Promise<VacancyChecklistItem[]>;
  create(data: CreateChecklistItemData): Promise<VacancyChecklistItem>;
  update(
    id: string,
    tenantId: string,
    data: UpdateChecklistItemData
  ): Promise<VacancyChecklistItem | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  countByVacancyId(vacancyId: string, tenantId: string): Promise<number>;
}
