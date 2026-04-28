import type { VacancyCommitment } from "../entities/VacancyCommitment";
import type { CommitmentStatusType } from "@features/vacancy/frontend/types/vacancy.types";

export interface CreateCommitmentData {
  vacancyId: string;
  tenantId: string;
  description: string;
  dueDate: Date;
  responsibleUserId: string;
  createdById: string;
}

export interface UpdateCommitmentStatusData {
  status: CommitmentStatusType;
  completedAt?: Date;
  completedById?: string;
  cancelledAt?: Date;
  cancelledById?: string;
  cancelReason?: string;
}

export interface UpdateCommitmentData {
  description?: string;
  dueDate?: Date;
}

export interface AppendCommitmentEventData {
  commitmentId: string;
  tenantId: string;
  previousStatus: CommitmentStatusType;
  newStatus: CommitmentStatusType;
  note?: string | null;
  changedById: string;
}

export interface VacancyCommitmentEvent {
  id: string;
  commitmentId: string;
  tenantId: string;
  previousStatus: CommitmentStatusType;
  newStatus: CommitmentStatusType;
  note: string | null;
  changedById: string;
  changedByName?: string | null;
  createdAt: Date;
}

export interface IVacancyCommitmentRepository {
  findByVacancyId(
    vacancyId: string,
    tenantId: string
  ): Promise<VacancyCommitment[]>;
  findById(id: string, tenantId: string): Promise<VacancyCommitment | null>;
  create(data: CreateCommitmentData): Promise<VacancyCommitment>;
  update(
    id: string,
    tenantId: string,
    data: UpdateCommitmentData
  ): Promise<VacancyCommitment>;
  updateStatus(
    id: string,
    tenantId: string,
    data: UpdateCommitmentStatusData
  ): Promise<VacancyCommitment>;
  appendEvent(
    data: AppendCommitmentEventData
  ): Promise<VacancyCommitmentEvent>;
  getHistory(
    commitmentId: string,
    tenantId: string
  ): Promise<VacancyCommitmentEvent[]>;
}
