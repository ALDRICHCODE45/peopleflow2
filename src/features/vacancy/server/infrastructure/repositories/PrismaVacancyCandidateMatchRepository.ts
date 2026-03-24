import prisma from "@lib/prisma";
import type {
  IVacancyCandidateMatchRepository,
  UpsertMatchData,
  CandidateMatchData,
} from "../../domain/interfaces/IVacancyCandidateMatchRepository";
import type { CandidateMatchRating } from "@features/vacancy/frontend/types/vacancy.types";

type PrismaMatchRecord = {
  id: string;
  candidateId: string;
  checklistItemId: string;
  rating: string | null;
  feedback: string | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
};

export class PrismaVacancyCandidateMatchRepository
  implements IVacancyCandidateMatchRepository
{
  private mapToData(record: PrismaMatchRecord): CandidateMatchData {
    return {
      id: record.id,
      candidateId: record.candidateId,
      checklistItemId: record.checklistItemId,
      rating: record.rating as CandidateMatchRating | null,
      feedback: record.feedback,
      tenantId: record.tenantId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async upsert(data: UpsertMatchData): Promise<CandidateMatchData> {
    // Verify tenant ownership before upsert — the @@unique([candidateId, checklistItemId])
    // does NOT include tenantId, so a raw upsert could match a cross-tenant record.
    const existing = await prisma.vacancyCandidateMatch.findUnique({
      where: {
        candidateId_checklistItemId: {
          candidateId: data.candidateId,
          checklistItemId: data.checklistItemId,
        },
      },
      select: { id: true, tenantId: true },
    });

    if (existing && existing.tenantId !== data.tenantId) {
      throw new Error(
        "Tenant mismatch: cannot update a candidate match belonging to another tenant",
      );
    }

    const record = await prisma.vacancyCandidateMatch.upsert({
      where: {
        candidateId_checklistItemId: {
          candidateId: data.candidateId,
          checklistItemId: data.checklistItemId,
        },
      },
      create: {
        candidateId: data.candidateId,
        checklistItemId: data.checklistItemId,
        rating: data.rating,
        feedback: data.feedback,
        tenantId: data.tenantId,
      },
      update: {
        rating: data.rating,
        feedback: data.feedback,
      },
    });

    return this.mapToData(record as unknown as PrismaMatchRecord);
  }

  async findByCandidateId(
    candidateId: string,
    tenantId: string
  ): Promise<CandidateMatchData[]> {
    const records = await prisma.vacancyCandidateMatch.findMany({
      where: { candidateId, tenantId },
    });

    return records.map((r) =>
      this.mapToData(r as unknown as PrismaMatchRecord)
    );
  }

  async countRatedForCandidate(
    candidateId: string,
    vacancyChecklistItemIds: string[],
    tenantId: string
  ): Promise<number> {
    if (vacancyChecklistItemIds.length === 0) return 0;
    const count = await prisma.vacancyCandidateMatch.count({
      where: {
        candidateId,
        tenantId,
        checklistItemId: { in: vacancyChecklistItemIds },
        rating: { not: null },
      },
    });
    return count;
  }
}

export const prismaVacancyCandidateMatchRepository =
  new PrismaVacancyCandidateMatchRepository();
