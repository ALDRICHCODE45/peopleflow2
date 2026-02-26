import prisma from "@lib/prisma";
import type {
  IVacancyConfigRepository,
  UpsertVacancyConfigData,
  VacancyConfigData,
} from "../../domain/interfaces/IVacancyConfigRepository";

type PrismaConfigRecord = {
  id: string;
  tenantId: string;
  quickMeetingSlaHours: number;
  requirePhone: boolean;
  requireEmail: boolean;
  requireIsCurrentlyEmployed: boolean;
  requireCurrentCompany: boolean;
  requireCurrentSalary: boolean;
  requireSalaryExpectation: boolean;
  requireCurrentModality: boolean;
  requireCurrentLocation: boolean;
  requireCurrentCommissions: boolean;
  requireCurrentBenefits: boolean;
  requireCandidateLocation: boolean;
  requireOtherBenefits: boolean;
  requireCv: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class PrismaVacancyConfigRepository
  implements IVacancyConfigRepository
{
  private mapToData(record: PrismaConfigRecord): VacancyConfigData {
    return {
      id: record.id,
      tenantId: record.tenantId,
      quickMeetingSlaHours: record.quickMeetingSlaHours,
      requirePhone: record.requirePhone,
      requireEmail: record.requireEmail,
      requireIsCurrentlyEmployed: record.requireIsCurrentlyEmployed,
      requireCurrentCompany: record.requireCurrentCompany,
      requireCurrentSalary: record.requireCurrentSalary,
      requireSalaryExpectation: record.requireSalaryExpectation,
      requireCurrentModality: record.requireCurrentModality,
      requireCurrentLocation: record.requireCurrentLocation,
      requireCurrentCommissions: record.requireCurrentCommissions,
      requireCurrentBenefits: record.requireCurrentBenefits,
      requireCandidateLocation: record.requireCandidateLocation,
      requireOtherBenefits: record.requireOtherBenefits,
      requireCv: record.requireCv,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async findByTenantId(tenantId: string): Promise<VacancyConfigData | null> {
    const record = await prisma.vacancyConfig.findUnique({
      where: { tenantId },
    });

    if (!record) return null;
    return this.mapToData(record as unknown as PrismaConfigRecord);
  }

  async upsert(
    tenantId: string,
    data: UpsertVacancyConfigData
  ): Promise<VacancyConfigData> {
    const record = await prisma.vacancyConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        quickMeetingSlaHours: 48,
        requirePhone: false,
        requireEmail: false,
        requireIsCurrentlyEmployed: false,
        requireCurrentCompany: false,
        requireCurrentSalary: false,
        requireSalaryExpectation: false,
        requireCurrentModality: false,
        requireCurrentLocation: false,
        requireCurrentCommissions: false,
        requireCurrentBenefits: false,
        requireCandidateLocation: false,
        requireOtherBenefits: false,
        requireCv: false,
        ...data,
      },
      update: {
        ...(data.quickMeetingSlaHours !== undefined && {
          quickMeetingSlaHours: data.quickMeetingSlaHours,
        }),
        ...(data.requirePhone !== undefined && {
          requirePhone: data.requirePhone,
        }),
        ...(data.requireEmail !== undefined && {
          requireEmail: data.requireEmail,
        }),
        ...(data.requireIsCurrentlyEmployed !== undefined && {
          requireIsCurrentlyEmployed: data.requireIsCurrentlyEmployed,
        }),
        ...(data.requireCurrentCompany !== undefined && {
          requireCurrentCompany: data.requireCurrentCompany,
        }),
        ...(data.requireCurrentSalary !== undefined && {
          requireCurrentSalary: data.requireCurrentSalary,
        }),
        ...(data.requireSalaryExpectation !== undefined && {
          requireSalaryExpectation: data.requireSalaryExpectation,
        }),
        ...(data.requireCurrentModality !== undefined && {
          requireCurrentModality: data.requireCurrentModality,
        }),
        ...(data.requireCurrentLocation !== undefined && {
          requireCurrentLocation: data.requireCurrentLocation,
        }),
        ...(data.requireCurrentCommissions !== undefined && {
          requireCurrentCommissions: data.requireCurrentCommissions,
        }),
        ...(data.requireCurrentBenefits !== undefined && {
          requireCurrentBenefits: data.requireCurrentBenefits,
        }),
        ...(data.requireCandidateLocation !== undefined && {
          requireCandidateLocation: data.requireCandidateLocation,
        }),
        ...(data.requireOtherBenefits !== undefined && {
          requireOtherBenefits: data.requireOtherBenefits,
        }),
        ...(data.requireCv !== undefined && { requireCv: data.requireCv }),
      },
    });

    return this.mapToData(record as unknown as PrismaConfigRecord);
  }
}

export const prismaVacancyConfigRepository =
  new PrismaVacancyConfigRepository();
