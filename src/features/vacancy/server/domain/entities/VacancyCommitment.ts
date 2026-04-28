import { format } from "date-fns";

import type {
  VacancyCommitmentDTO,
  CommitmentStatusType,
  VacancyCommitmentEventDTO,
} from "@features/vacancy/frontend/types/vacancy.types";

export interface VacancyCommitmentProps {
  id: string;
  vacancyId: string;
  tenantId: string;
  description: string;
  dueDate: Date;
  status: CommitmentStatusType;
  responsibleUserId: string;
  responsibleUserName?: string | null;
  cancelledAt: Date | null;
  cancelledById: string | null;
  cancelReason: string | null;
  completedAt: Date | null;
  completedById: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  events?: VacancyCommitmentEventDTO[];
}

export class VacancyCommitment {
  private readonly props: VacancyCommitmentProps;

  constructor(props: VacancyCommitmentProps) {
    this.props = props;
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get vacancyId(): string {
    return this.props.vacancyId;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get description(): string {
    return this.props.description;
  }

  get dueDate(): Date {
    return this.props.dueDate;
  }

  get status(): CommitmentStatusType {
    return this.props.status;
  }

  get responsibleUserId(): string {
    return this.props.responsibleUserId;
  }

  get responsibleUserName(): string | null | undefined {
    return this.props.responsibleUserName;
  }

  get cancelledAt(): Date | null {
    return this.props.cancelledAt;
  }

  get cancelledById(): string | null {
    return this.props.cancelledById;
  }

  get cancelReason(): string | null {
    return this.props.cancelReason;
  }

  get completedAt(): Date | null {
    return this.props.completedAt;
  }

  get completedById(): string | null {
    return this.props.completedById;
  }

  get createdById(): string | null {
    return this.props.createdById;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get events(): VacancyCommitmentEventDTO[] | undefined {
    return this.props.events;
  }

  // --- Domain Methods ---

  isOverdue(): boolean {
    if (this.props.status !== "PENDING") {
      return false;
    }
    // Compare calendar days (start of day) to avoid timezone issues
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateStart = new Date(this.props.dueDate);
    dueDateStart.setHours(0, 0, 0, 0);
    return dueDateStart < today;
  }

  canComplete(): boolean {
    return this.props.status === "PENDING";
  }

  canCancel(): boolean {
    return this.props.status === "PENDING";
  }

  canEdit(): boolean {
    return this.props.status === "PENDING";
  }

  toJSON(): VacancyCommitmentDTO {
    return {
      id: this.props.id,
      vacancyId: this.props.vacancyId,
      tenantId: this.props.tenantId,
      description: this.props.description,
      dueDate: format(this.props.dueDate, "yyyy-MM-dd"),
      status: this.props.status,
      responsibleUserId: this.props.responsibleUserId,
      responsibleUserName: this.props.responsibleUserName,
      cancelledAt: this.props.cancelledAt
        ? this.props.cancelledAt.toISOString()
        : null,
      cancelledById: this.props.cancelledById,
      cancelReason: this.props.cancelReason,
      completedAt: this.props.completedAt
        ? this.props.completedAt.toISOString()
        : null,
      completedById: this.props.completedById,
      createdById: this.props.createdById,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      events: this.props.events,
    };
  }
}
