import prisma from "@lib/prisma";
import { Prisma } from "@core/generated/prisma/client";
import type {
  IVacancyStatusHistoryRepository,
  CreateStatusHistoryData,
  VacancyStatusHistoryEntry,
  PlacementRow,
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

  async getPlacementsReport(params: {
    tenantId: string;
    from: Date;
    toExclusive: Date;
  }): Promise<PlacementRow[]> {
    const { tenantId, from, toExclusive } = params;

    const rows = await prisma.$queryRaw<PlacementRow[]>(Prisma.sql`
      SELECT DISTINCT ON (sh."vacancyId")
        sh."vacancyId" AS "vacancyId",
        v.position    AS position,
        v."clientId"  AS "clientId",
        c.nombre      AS "clientName",
        v."recruiterId" AS "recruiterId",
        u.name        AS "recruiterName",
        v."isWarranty" AS "isWarranty",
        sh."createdAt" AS "placedAt"
      FROM vacancy_status_history sh
      JOIN vacancy v ON sh."vacancyId" = v.id
      JOIN client  c ON v."clientId"   = c.id
      JOIN "user"  u ON v."recruiterId" = u.id
      WHERE sh."tenantId"  = ${tenantId}
        AND sh."newStatus" = 'PLACEMENT'
        AND sh."createdAt" >= ${from}
        AND sh."createdAt" <  ${toExclusive}
      ORDER BY sh."vacancyId", sh."createdAt" DESC
    `);

    return rows.map((r) => ({
      ...r,
      isWarranty: Boolean(r.isWarranty),
    }));
  }
}

export const prismaVacancyStatusHistoryRepository =
  new PrismaVacancyStatusHistoryRepository();
