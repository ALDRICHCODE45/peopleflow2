import prisma from "@lib/prisma";
import {
  VacancyCandidate,
  type VacancyCandidateProps,
} from "../../domain/entities/VacancyCandidate";
import type {
  IVacancyCandidateRepository,
  CreateCandidateData,
  UpdateCandidateData,
} from "../../domain/interfaces/IVacancyCandidateRepository";
import type {
  VacancyModality,
  CandidateStatus,
} from "@features/vacancy/frontend/types/vacancy.types";

type PrismaCandidateRecord = {
  id: string;
  vacancyId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  isCurrentlyEmployed: boolean | null;
  currentCompany: string | null;
  currentSalary: number | null;
  salaryExpectation: number | null;
  currentModality: string | null;
  countryCode: string | null;
  regionCode: string | null;
  currentCommissions: string | null;
  currentBenefits: string | null;
  candidateLocation: string | null;
  otherBenefits: string | null;
  status: string;
  isInTerna: boolean;
  isFinalist: boolean;
  finalSalary: number | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
};

export class PrismaVacancyCandidateRepository
  implements IVacancyCandidateRepository
{
  private mapToDomain(record: PrismaCandidateRecord): VacancyCandidate {
    const props: VacancyCandidateProps = {
      id: record.id,
      vacancyId: record.vacancyId,
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phone: record.phone,
      isCurrentlyEmployed: record.isCurrentlyEmployed,
      currentCompany: record.currentCompany,
      currentSalary: record.currentSalary,
      salaryExpectation: record.salaryExpectation,
      currentModality: (record.currentModality as VacancyModality) ?? null,
      countryCode: record.countryCode,
      regionCode: record.regionCode,
      currentCommissions: record.currentCommissions,
      currentBenefits: record.currentBenefits,
      candidateLocation: record.candidateLocation,
      otherBenefits: record.otherBenefits,
      status: record.status as CandidateStatus,
      isInTerna: record.isInTerna,
      isFinalist: record.isFinalist,
      finalSalary: record.finalSalary,
      tenantId: record.tenantId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
    return new VacancyCandidate(props);
  }

  async findById(
    id: string,
    tenantId: string
  ): Promise<VacancyCandidate | null> {
    const record = await prisma.vacancyCandidate.findUnique({
      where: { id },
    });

    if (!record || record.tenantId !== tenantId) return null;
    return this.mapToDomain(record as unknown as PrismaCandidateRecord);
  }

  async findByVacancyId(
    vacancyId: string,
    tenantId: string
  ): Promise<VacancyCandidate[]> {
    const records = await prisma.vacancyCandidate.findMany({
      where: { vacancyId, tenantId },
      orderBy: { createdAt: "asc" },
    });

    return records.map((r) =>
      this.mapToDomain(r as unknown as PrismaCandidateRecord)
    );
  }

  async findTernaByVacancyId(
    vacancyId: string,
    tenantId: string
  ): Promise<VacancyCandidate[]> {
    const records = await prisma.vacancyCandidate.findMany({
      where: { vacancyId, tenantId, isInTerna: true },
    });

    return records.map((r) =>
      this.mapToDomain(r as unknown as PrismaCandidateRecord)
    );
  }

  async create(data: CreateCandidateData): Promise<VacancyCandidate> {
    const record = await prisma.vacancyCandidate.create({
      data: {
        vacancyId: data.vacancyId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email ?? null,
        phone: data.phone ?? null,
        isCurrentlyEmployed: data.isCurrentlyEmployed ?? null,
        currentCompany: data.currentCompany ?? null,
        currentSalary: data.currentSalary ?? null,
        salaryExpectation: data.salaryExpectation ?? null,
        currentModality: data.currentModality ?? null,
        countryCode: data.countryCode ?? null,
        regionCode: data.regionCode ?? null,
        currentCommissions: data.currentCommissions ?? null,
        currentBenefits: data.currentBenefits ?? null,
        candidateLocation: data.candidateLocation ?? null,
        otherBenefits: data.otherBenefits ?? null,
        status: "EN_PROCESO",
        isInTerna: false,
        isFinalist: false,
        tenantId: data.tenantId,
      },
    });

    return this.mapToDomain(record as unknown as PrismaCandidateRecord);
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateCandidateData
  ): Promise<VacancyCandidate | null> {
    const result = await prisma.vacancyCandidate.updateMany({
      where: { id, tenantId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.isCurrentlyEmployed !== undefined && {
          isCurrentlyEmployed: data.isCurrentlyEmployed,
        }),
        ...(data.currentCompany !== undefined && {
          currentCompany: data.currentCompany,
        }),
        ...(data.currentSalary !== undefined && {
          currentSalary: data.currentSalary,
        }),
        ...(data.salaryExpectation !== undefined && {
          salaryExpectation: data.salaryExpectation,
        }),
        ...(data.currentModality !== undefined && {
          currentModality: data.currentModality,
        }),
        ...(data.countryCode !== undefined && {
          countryCode: data.countryCode,
        }),
        ...(data.regionCode !== undefined && {
          regionCode: data.regionCode,
        }),
        ...(data.currentCommissions !== undefined && {
          currentCommissions: data.currentCommissions,
        }),
        ...(data.currentBenefits !== undefined && {
          currentBenefits: data.currentBenefits,
        }),
        ...(data.candidateLocation !== undefined && {
          candidateLocation: data.candidateLocation,
        }),
        ...(data.otherBenefits !== undefined && {
          otherBenefits: data.otherBenefits,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.isInTerna !== undefined && { isInTerna: data.isInTerna }),
        ...(data.isFinalist !== undefined && { isFinalist: data.isFinalist }),
        ...(data.finalSalary !== undefined && { finalSalary: data.finalSalary }),
      },
    });

    if (result.count === 0) return null;

    const updated = await prisma.vacancyCandidate.findUnique({
      where: { id },
    });

    if (!updated) return null;
    return this.mapToDomain(updated as unknown as PrismaCandidateRecord);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await prisma.vacancyCandidate.deleteMany({
      where: { id, tenantId },
    });
    return result.count > 0;
  }

  async markAsInTerna(
    ids: string[],
    vacancyId: string,
    tenantId: string
  ): Promise<number> {
    const result = await prisma.vacancyCandidate.updateMany({
      where: { id: { in: ids }, vacancyId, tenantId },
      data: { isInTerna: true, status: "EN_TERNA" },
    });
    return result.count;
  }

  async clearTerna(vacancyId: string, tenantId: string): Promise<number> {
    const result = await prisma.vacancyCandidate.updateMany({
      where: { vacancyId, tenantId, isInTerna: true },
      data: { isInTerna: false },
    });
    return result.count;
  }

  async markAsContratado(
    id: string,
    vacancyId: string,
    tenantId: string
  ): Promise<void> {
    await prisma.$transaction([
      // Mark the selected candidate as CONTRATADO and remove from terna
      prisma.vacancyCandidate.updateMany({
        where: { id, vacancyId, tenantId },
        data: { status: "CONTRATADO", isInTerna: false },
      }),
      // Auto-discard all other candidates in the same vacancy
      prisma.vacancyCandidate.updateMany({
        where: { vacancyId, tenantId, id: { not: id } },
        data: { status: "DESCARTADO" },
      }),
    ]);
  }

  async resetCandidatesOnRollback(
    vacancyId: string,
    tenantId: string
  ): Promise<void> {
    await prisma.vacancyCandidate.updateMany({
      where: { vacancyId, tenantId },
      data: { status: "EN_PROCESO", isInTerna: false },
    });
  }

  async markNonTernaAsDescartado(
    vacancyId: string,
    tenantId: string,
    ternaIds: string[]
  ): Promise<void> {
    await prisma.vacancyCandidate.updateMany({
      where: {
        vacancyId,
        tenantId,
        id: { notIn: ternaIds },
      },
      data: { status: "DESCARTADO" },
    });
  }
}

export const prismaVacancyCandidateRepository =
  new PrismaVacancyCandidateRepository();
