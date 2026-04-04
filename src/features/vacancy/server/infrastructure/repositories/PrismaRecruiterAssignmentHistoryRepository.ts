import prisma from "@lib/prisma";
import type {
  IRecruiterAssignmentHistoryRepository,
  BulkReassignInput,
  CreateAssignmentData,
  LegacyBulkReassignInput,
  ReassignData,
} from "../../domain/interfaces/IRecruiterAssignmentHistoryRepository";
import type {
  RecruiterAssignmentHistoryDTO,
  ReassignmentReasonType,
  VacancyStatusType,
} from "@features/vacancy/frontend/types/vacancy.types";
import type { BulkActionResult } from "../../domain/types/bulk-action.types";

type PrismaAssignmentRecord = {
  id: string;
  vacancyId: string;
  recruiterId: string;
  recruiterName: string;
  assignedAt: Date;
  unassignedAt: Date | null;
  durationDays: number | null;
  vacancyStatusOnEntry: string;
  vacancyStatusOnExit: string | null;
  reason: string | null;
  notes: string | null;
  targetDeliveryDate: Date | null;
  wasOverdue: boolean;
  assignedById: string;
  assignedByName: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
};

export class PrismaRecruiterAssignmentHistoryRepository
  implements IRecruiterAssignmentHistoryRepository
{
  private mapToDTO(record: PrismaAssignmentRecord): RecruiterAssignmentHistoryDTO {
    return {
      id: record.id,
      vacancyId: record.vacancyId,
      recruiterId: record.recruiterId,
      recruiterName: record.recruiterName,
      assignedAt: record.assignedAt.toISOString(),
      unassignedAt: record.unassignedAt?.toISOString() ?? null,
      durationDays: record.durationDays,
      vacancyStatusOnEntry: record.vacancyStatusOnEntry as VacancyStatusType,
      vacancyStatusOnExit: record.vacancyStatusOnExit
        ? (record.vacancyStatusOnExit as VacancyStatusType)
        : null,
      reason: record.reason as ReassignmentReasonType | null,
      notes: record.notes,
      targetDeliveryDate: record.targetDeliveryDate?.toISOString() ?? null,
      wasOverdue: record.wasOverdue,
      assignedById: record.assignedById,
      assignedByName: record.assignedByName,
      tenantId: record.tenantId,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  /**
   * Compute duration in days between two dates.
   */
  private computeDurationDays(assignedAt: Date, unassignedAt: Date): number {
    const diffMs = unassignedAt.getTime() - assignedAt.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  async create(data: CreateAssignmentData): Promise<RecruiterAssignmentHistoryDTO> {
    const record = await prisma.recruiterAssignmentHistory.create({
      data: {
        vacancyId: data.vacancyId,
        recruiterId: data.recruiterId,
        recruiterName: data.recruiterName,
        assignedAt: data.assignedAt ?? new Date(),
        vacancyStatusOnEntry: data.vacancyStatusOnEntry,
        reason: data.reason ?? null,
        notes: data.notes ?? null,
        targetDeliveryDate: data.targetDeliveryDate ?? null,
        wasOverdue: data.wasOverdue ?? false,
        assignedById: data.assignedById,
        assignedByName: data.assignedByName,
        tenantId: data.tenantId,
      },
    });

    return this.mapToDTO(record as unknown as PrismaAssignmentRecord);
  }

  async closeCurrentAssignment(
    vacancyId: string,
    tenantId: string,
    statusOnExit: VacancyStatusType
  ): Promise<void> {
    const current = await prisma.recruiterAssignmentHistory.findFirst({
      where: { vacancyId, tenantId, unassignedAt: null },
      orderBy: { assignedAt: "desc" },
    });

    if (!current) return;

    const now = new Date();
    const durationDays = this.computeDurationDays(current.assignedAt, now);

    await prisma.recruiterAssignmentHistory.update({
      where: { id: current.id },
      data: {
        unassignedAt: now,
        durationDays,
        vacancyStatusOnExit: statusOnExit,
      },
    });
  }

  async findByVacancyId(
    vacancyId: string,
    tenantId: string
  ): Promise<RecruiterAssignmentHistoryDTO[]> {
    const records = await prisma.recruiterAssignmentHistory.findMany({
      where: { vacancyId, tenantId },
      orderBy: { assignedAt: "desc" },
    });

    return records.map((r) =>
      this.mapToDTO(r as unknown as PrismaAssignmentRecord)
    );
  }

  async reassign(data: ReassignData): Promise<RecruiterAssignmentHistoryDTO> {
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find and close the current assignment
      const currentAssignment = await tx.recruiterAssignmentHistory.findFirst({
        where: {
          vacancyId: data.vacancyId,
          tenantId: data.tenantId,
          unassignedAt: null,
        },
        orderBy: { assignedAt: "desc" },
      });

      if (currentAssignment) {
        const durationDays = this.computeDurationDays(
          currentAssignment.assignedAt,
          now
        );

        await tx.recruiterAssignmentHistory.update({
          where: { id: currentAssignment.id },
          data: {
            unassignedAt: now,
            durationDays,
            vacancyStatusOnExit: data.currentVacancyStatus,
          },
        });
      }

      // 2. Update the vacancy's recruiterId and reset currentCycleStartedAt
      await tx.vacancy.updateMany({
        where: { id: data.vacancyId, tenantId: data.tenantId },
        data: {
          recruiterId: data.newRecruiterId,
          currentCycleStartedAt: now,
        },
      });

      // 3. Create the new assignment record
      const newAssignment = await tx.recruiterAssignmentHistory.create({
        data: {
          vacancyId: data.vacancyId,
          recruiterId: data.newRecruiterId,
          recruiterName: data.newRecruiterName,
          assignedAt: now,
          vacancyStatusOnEntry: data.currentVacancyStatus,
          reason: data.reason,
          notes: data.notes ?? null,
          targetDeliveryDate: data.targetDeliveryDate ?? null,
          wasOverdue: data.wasOverdue ?? false,
          assignedById: data.assignedById,
          assignedByName: data.assignedByName,
          tenantId: data.tenantId,
        },
      });

      return newAssignment;
    });

    return this.mapToDTO(result as unknown as PrismaAssignmentRecord);
  }

  async bulkReassign(input: BulkReassignInput): Promise<BulkActionResult>;
  async bulkReassign(input: LegacyBulkReassignInput): Promise<BulkActionResult>;
  async bulkReassign(
    input: BulkReassignInput | LegacyBulkReassignInput,
  ): Promise<BulkActionResult> {
    const normalized = "vacancyIds" in input
      ? {
          tenantId: input.tenantId,
          vacancyIds: Array.from(new Set(input.vacancyIds)),
          recruiterId: input.newRecruiterId,
          recruiterName: null as string | null,
          reason: input.reason,
          notes: input.notes ?? null,
          assignedById: input.assignedByUserId,
          assignedByName: input.assignedByName,
        }
      : {
          tenantId: input.tenantId,
          vacancyIds: Array.from(new Set(input.vacancies.map((vacancy) => vacancy.id))),
          recruiterId: input.recruiterId,
          recruiterName: input.recruiterName,
          reason: input.reason,
          notes: input.notes ?? null,
          assignedById: input.assignedById,
          assignedByName: input.assignedByName,
        };

    if (normalized.vacancyIds.length === 0) {
      return { succeeded: [], failed: [] };
    }

    const vacancies = await prisma.vacancy.findMany({
      where: {
        tenantId: normalized.tenantId,
        id: { in: normalized.vacancyIds },
      },
      select: {
        id: true,
        status: true,
        targetDeliveryDate: true,
      },
    });

    const foundIds = new Set(vacancies.map((vacancy) => vacancy.id));
    const missingFailed: BulkActionResult["failed"] = normalized.vacancyIds
      .filter((id) => !foundIds.has(id))
      .map((id) => ({
        id,
        reason: "La vacante no existe o no pertenece al tenant activo",
      }));

    if (vacancies.length === 0) {
      return {
        succeeded: [],
        failed: missingFailed,
      };
    }

    const now = new Date();

    try {
      await prisma.$transaction(async (tx) => {
        const currentAssignments = await tx.recruiterAssignmentHistory.findMany({
          where: {
            tenantId: normalized.tenantId,
            vacancyId: { in: vacancies.map((vacancy) => vacancy.id) },
            unassignedAt: null,
          },
          select: {
            id: true,
            vacancyId: true,
            assignedAt: true,
          },
        });

        if (currentAssignments.length > 0) {
          await Promise.all(
            currentAssignments.map((assignment) => {
              const vacancy = vacancies.find((item) => item.id === assignment.vacancyId);
              if (!vacancy) {
                return Promise.resolve();
              }

              return tx.recruiterAssignmentHistory.update({
                where: { id: assignment.id },
                data: {
                  unassignedAt: now,
                  durationDays: this.computeDurationDays(assignment.assignedAt, now),
                  vacancyStatusOnExit: vacancy.status,
                },
              });
            }),
          );
        }

        await tx.vacancy.updateMany({
          where: {
            tenantId: normalized.tenantId,
            id: { in: vacancies.map((vacancy) => vacancy.id) },
          },
          data: {
            recruiterId: normalized.recruiterId,
            currentCycleStartedAt: now,
          },
        });

        let recruiterName = normalized.recruiterName;
        if (!recruiterName) {
          const recruiter = await tx.user.findUnique({
            where: { id: normalized.recruiterId },
            select: { name: true },
          });
          recruiterName = recruiter?.name ?? "Reclutador";
        }

        await tx.recruiterAssignmentHistory.createMany({
          data: vacancies.map((vacancy) => ({
            vacancyId: vacancy.id,
            recruiterId: normalized.recruiterId,
            recruiterName,
            assignedAt: now,
            vacancyStatusOnEntry: vacancy.status,
            reason: normalized.reason as ReassignmentReasonType,
            notes: normalized.notes,
            targetDeliveryDate: vacancy.targetDeliveryDate,
            wasOverdue:
              vacancy.targetDeliveryDate !== null && vacancy.targetDeliveryDate < now,
            assignedById: normalized.assignedById,
            assignedByName: normalized.assignedByName,
            tenantId: normalized.tenantId,
          })),
        });
      });
    } catch (error) {
      console.error("Error in bulkReassign:", error);

      return {
        succeeded: [],
        failed: [
          ...missingFailed,
          ...vacancies.map((vacancy) => ({
            id: vacancy.id,
            reason: "No se pudo completar la reasignación",
          })),
        ],
      };
    }

    return {
      succeeded: vacancies.map((vacancy) => vacancy.id),
      failed: missingFailed,
    };
  }
}

export const prismaRecruiterAssignmentHistoryRepository =
  new PrismaRecruiterAssignmentHistoryRepository();
