import prisma from "@lib/prisma";
import type {
  IVacancyCandidateMatchRepository,
  UpsertMatchData,
  CandidateMatchData,
} from "../../domain/interfaces/IVacancyCandidateMatchRepository";

type PrismaMatchRecord = {
  id: string;
  candidateId: string;
  checklistItemId: string;
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
      feedback: record.feedback,
      tenantId: record.tenantId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async upsert(data: UpsertMatchData): Promise<CandidateMatchData> {
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
        feedback: data.feedback,
        tenantId: data.tenantId,
      },
      update: {
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
}

export const prismaVacancyCandidateMatchRepository =
  new PrismaVacancyCandidateMatchRepository();
