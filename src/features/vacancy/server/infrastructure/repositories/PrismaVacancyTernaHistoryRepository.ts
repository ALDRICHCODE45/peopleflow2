import prisma from "@lib/prisma";
import {
  VacancyTernaHistory,
  type VacancyTernaHistoryProps,
  type TernaHistoryCandidateProps,
} from "../../domain/entities/VacancyTernaHistory";
import type {
  IVacancyTernaHistoryRepository,
  CreateTernaHistoryData,
} from "../../domain/interfaces/IVacancyTernaHistoryRepository";

export class PrismaVacancyTernaHistoryRepository
  implements IVacancyTernaHistoryRepository
{
  private mapToDomain(record: {
    id: string;
    vacancyId: string;
    ternaNumber: number;
    validatedAt: Date;
    validatedById: string;
    validatedBy?: { name: string | null } | null;
    targetDeliveryDate: Date | null;
    isOnTime: boolean;
    tenantId: string;
    createdAt: Date;
    candidates: {
      id: string;
      ternaHistoryId: string;
      candidateId: string;
      candidateFullName: string;
      tenantId: string;
    }[];
  }): VacancyTernaHistory {
    const props: VacancyTernaHistoryProps = {
      id: record.id,
      vacancyId: record.vacancyId,
      ternaNumber: record.ternaNumber,
      validatedAt: record.validatedAt,
      validatedById: record.validatedById,
      validatedByName: record.validatedBy?.name ?? null,
      targetDeliveryDate: record.targetDeliveryDate,
      isOnTime: record.isOnTime,
      tenantId: record.tenantId,
      createdAt: record.createdAt,
      candidates: record.candidates.map(
        (c): TernaHistoryCandidateProps => ({
          id: c.id,
          ternaHistoryId: c.ternaHistoryId,
          candidateId: c.candidateId,
          candidateFullName: c.candidateFullName,
          tenantId: c.tenantId,
        })
      ),
    };
    return new VacancyTernaHistory(props);
  }

  async create(data: CreateTernaHistoryData): Promise<VacancyTernaHistory> {
    const record = await prisma.vacancyTernaHistory.create({
      data: {
        vacancyId: data.vacancyId,
        ternaNumber: data.ternaNumber,
        validatedById: data.validatedById,
        targetDeliveryDate: data.targetDeliveryDate,
        isOnTime: data.isOnTime,
        tenantId: data.tenantId,
        candidates: {
          create: data.candidates.map((c) => ({
            candidateId: c.candidateId,
            candidateFullName: c.candidateFullName,
            tenantId: data.tenantId,
          })),
        },
      },
      include: {
        validatedBy: { select: { name: true } },
        candidates: true,
      },
    });

    return this.mapToDomain(record as Parameters<typeof this.mapToDomain>[0]);
  }

  async findByVacancyId(
    vacancyId: string,
    tenantId: string
  ): Promise<VacancyTernaHistory[]> {
    const records = await prisma.vacancyTernaHistory.findMany({
      where: { vacancyId, tenantId },
      include: {
        validatedBy: { select: { name: true } },
        candidates: true,
      },
      orderBy: { ternaNumber: "asc" },
    });

    return records.map((r) =>
      this.mapToDomain(r as Parameters<typeof this.mapToDomain>[0])
    );
  }

  async countByVacancyId(vacancyId: string, tenantId: string): Promise<number> {
    return prisma.vacancyTernaHistory.count({
      where: { vacancyId, tenantId },
    });
  }
}

export const prismaVacancyTernaHistoryRepository =
  new PrismaVacancyTernaHistoryRepository();
