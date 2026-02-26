import prisma from "@lib/prisma";
import type {
  IVacancyStatusHistoryRepository,
  CreateStatusHistoryData,
  VacancyStatusHistoryEntry,
} from "../../domain/interfaces/IVacancyStatusHistoryRepository";
import type { VacancyStatusType } from "@features/vacancy/frontend/types/vacancy.types";

type PrismaStatusHistoryRecord = {
  id: string;
  vacancyId: string;
  previousStatus: string;
  newStatus: string;
  isRollback: boolean;
  reason: string | null;
  newTargetDeliveryDate: Date | null;
  changedById: string;
  changedBy: { name: string | null } | null;
  tenantId: string;
  createdAt: Date;
};

export class PrismaVacancyStatusHistoryRepository
  implements IVacancyStatusHistoryRepository
{
  private mapToEntry(
    record: PrismaStatusHistoryRecord
  ): VacancyStatusHistoryEntry {
    return {
      id: record.id,
      vacancyId: record.vacancyId,
      previousStatus: record.previousStatus as VacancyStatusType,
      newStatus: record.newStatus as VacancyStatusType,
      isRollback: record.isRollback,
      reason: record.reason,
      newTargetDeliveryDate: record.newTargetDeliveryDate,
      changedById: record.changedById,
      changedByName: record.changedBy?.name ?? null,
      tenantId: record.tenantId,
      createdAt: record.createdAt,
    };
  }

  async create(
    data: CreateStatusHistoryData
  ): Promise<VacancyStatusHistoryEntry> {
    const record = await prisma.vacancyStatusHistory.create({
      data: {
        vacancyId: data.vacancyId,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
        isRollback: data.isRollback,
        reason: data.reason ?? null,
        newTargetDeliveryDate: data.newTargetDeliveryDate ?? null,
        changedById: data.changedById,
        tenantId: data.tenantId,
      },
      include: {
        changedBy: { select: { name: true } },
      },
    });

    return this.mapToEntry(record as unknown as PrismaStatusHistoryRecord);
  }

  async findByVacancyId(
    vacancyId: string,
    tenantId: string
  ): Promise<VacancyStatusHistoryEntry[]> {
    const records = await prisma.vacancyStatusHistory.findMany({
      where: { vacancyId, tenantId },
      include: {
        changedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return records.map((r) =>
      this.mapToEntry(r as unknown as PrismaStatusHistoryRecord)
    );
  }
}

export const prismaVacancyStatusHistoryRepository =
  new PrismaVacancyStatusHistoryRepository();
