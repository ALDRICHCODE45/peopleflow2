import type {
  RecruiterAssignmentHistoryDTO,
  VacancyStatusType,
  ReassignmentReasonType,
} from "@features/vacancy/frontend/types/vacancy.types";

export interface RecruiterAssignmentHistoryProps {
  id: string;
  vacancyId: string;
  recruiterId: string;
  recruiterName: string;
  assignedAt: Date;
  unassignedAt: Date | null;
  durationDays: number | null;
  vacancyStatusOnEntry: VacancyStatusType;
  vacancyStatusOnExit: VacancyStatusType | null;
  reason: ReassignmentReasonType | null;
  notes: string | null;
  targetDeliveryDate: Date | null;
  wasOverdue: boolean;
  assignedById: string;
  assignedByName: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class RecruiterAssignmentHistory {
  private readonly props: RecruiterAssignmentHistoryProps;

  constructor(props: RecruiterAssignmentHistoryProps) {
    this.props = props;
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get vacancyId(): string {
    return this.props.vacancyId;
  }

  get recruiterId(): string {
    return this.props.recruiterId;
  }

  get recruiterName(): string {
    return this.props.recruiterName;
  }

  get assignedAt(): Date {
    return this.props.assignedAt;
  }

  get unassignedAt(): Date | null {
    return this.props.unassignedAt;
  }

  get durationDays(): number | null {
    return this.props.durationDays;
  }

  get vacancyStatusOnEntry(): VacancyStatusType {
    return this.props.vacancyStatusOnEntry;
  }

  get vacancyStatusOnExit(): VacancyStatusType | null {
    return this.props.vacancyStatusOnExit;
  }

  get reason(): ReassignmentReasonType | null {
    return this.props.reason;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get targetDeliveryDate(): Date | null {
    return this.props.targetDeliveryDate;
  }

  get wasOverdue(): boolean {
    return this.props.wasOverdue;
  }

  get assignedById(): string {
    return this.props.assignedById;
  }

  get assignedByName(): string {
    return this.props.assignedByName;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // --- Domain Methods ---

  /**
   * Returns true if this is the current (active) assignment.
   * An assignment is current when it hasn't been closed (unassignedAt is null).
   */
  isCurrent(): boolean {
    return this.props.unassignedAt === null;
  }

  /**
   * Computes the duration of this assignment in days.
   * - If unassignedAt exists, calculates from assignedAt to unassignedAt.
   * - If null (current assignment), calculates from assignedAt to now.
   */
  getDurationDays(): number {
    const end = this.props.unassignedAt ?? new Date();
    const diffMs = end.getTime() - this.props.assignedAt.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  toJSON(): RecruiterAssignmentHistoryDTO {
    return {
      id: this.props.id,
      vacancyId: this.props.vacancyId,
      recruiterId: this.props.recruiterId,
      recruiterName: this.props.recruiterName,
      assignedAt: this.props.assignedAt.toISOString(),
      unassignedAt: this.props.unassignedAt?.toISOString() ?? null,
      durationDays: this.props.durationDays,
      vacancyStatusOnEntry: this.props.vacancyStatusOnEntry,
      vacancyStatusOnExit: this.props.vacancyStatusOnExit,
      reason: this.props.reason,
      notes: this.props.notes,
      targetDeliveryDate: this.props.targetDeliveryDate?.toISOString() ?? null,
      wasOverdue: this.props.wasOverdue,
      assignedById: this.props.assignedById,
      assignedByName: this.props.assignedByName,
      tenantId: this.props.tenantId,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
