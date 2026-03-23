import type {
  VacancyStatusType,
  ReassignmentReasonType,
  RecruiterAssignmentHistoryDTO,
} from "@features/vacancy/frontend/types/vacancy.types";

export interface CreateAssignmentData {
  vacancyId: string;
  recruiterId: string;
  recruiterName: string;
  assignedAt?: Date;
  vacancyStatusOnEntry: VacancyStatusType;
  reason?: ReassignmentReasonType | null;
  notes?: string | null;
  targetDeliveryDate?: Date | null;
  wasOverdue?: boolean;
  assignedById: string;
  assignedByName: string;
  tenantId: string;
}

export interface ReassignData {
  vacancyId: string;
  tenantId: string;
  newRecruiterId: string;
  newRecruiterName: string;
  reason: ReassignmentReasonType;
  notes?: string | null;
  currentVacancyStatus: VacancyStatusType;
  targetDeliveryDate?: Date | null;
  wasOverdue?: boolean;
  assignedById: string;
  assignedByName: string;
}

export interface IRecruiterAssignmentHistoryRepository {
  create(data: CreateAssignmentData): Promise<RecruiterAssignmentHistoryDTO>;

  closeCurrentAssignment(
    vacancyId: string,
    tenantId: string,
    statusOnExit: VacancyStatusType
  ): Promise<void>;

  findByVacancyId(
    vacancyId: string,
    tenantId: string
  ): Promise<RecruiterAssignmentHistoryDTO[]>;

  /**
   * Transactional operation: closes current assignment, updates vacancy recruiterId
   * and currentCycleStartedAt, creates new assignment record.
   */
  reassign(data: ReassignData): Promise<RecruiterAssignmentHistoryDTO>;
}
