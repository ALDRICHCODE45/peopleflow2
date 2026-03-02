import prisma from "@lib/prisma";
import { Vacancy, type VacancyProps } from "../../domain/entities/Vacancy";
import type {
  IVacancyRepository,
  CreateVacancyData,
  UpdateVacancyData,
  FindVacanciesFilters,
  FindPaginatedVacanciesParams,
  PaginatedResult,
  ChecklistValidationResult,
} from "../../domain/interfaces/IVacancyRepository";
import type {
  VacancyStatusType,
  VacancySaleType,
  VacancyModality,
  VacancyCandidateDTO,
  VacancyChecklistItemDTO,
  VacancyStatusHistoryDTO,
  AttachmentDTO,
} from "@features/vacancy/frontend/types/vacancy.types";

type VacancyWithRelations = {
  id: string;
  position: string;
  status: string;
  recruiterId: string;
  recruiter: { name: string | null } | null;
  clientId: string;
  client: { nombre: string } | null;
  saleType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryFixed: number | null;
  commissions: string | null;
  benefits: string | null;
  tools: string | null;
  modality: string | null;
  schedule: string | null;
  countryCode: string | null;
  regionCode: string | null;
  requiresPsychometry: boolean;
  checklistValidatedAt: Date | null;
  checklistValidatedById: string | null;
  checklistRejectionReason: string | null;
  assignedAt: Date;
  targetDeliveryDate: Date | null;
  actualDeliveryDate: Date | null;
  entryDate: Date | null;
  rollbackCount: number;
  placementConfirmedAt: Date | null;
  commissionDate: Date | null;
  congratsEmailSent: boolean;
  tenantId: string;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const ALLOWED_ORDER_FIELDS = [
  "position",
  "status",
  "assignedAt",
  "createdAt",
  "updatedAt",
];

export class PrismaVacancyRepository implements IVacancyRepository {
  private getBaseInclude() {
    return {
      recruiter: { select: { name: true, email: true, avatar: true } },
      client: { select: { nombre: true } },
    } as const;
  }

  private getDetailInclude() {
    return {
      recruiter: { select: { name: true, email: true, avatar: true } },
      client: { select: { nombre: true } },
      candidates: {
        orderBy: { createdAt: "asc" as const },
        include: {
          checklistMatches: true,
          attachments: {
            where: { subType: "CV" as const },
            orderBy: { createdAt: "desc" as const },
          },
        },
      },
      checklistItems: {
        orderBy: { order: "asc" as const },
        include: { candidateMatches: true },
      },
      statusHistory: {
        orderBy: { createdAt: "desc" as const },
        include: { changedBy: { select: { name: true } } },
      },
    } as const;
  }

  private buildWhereClause(
    tenantId: string,
    filters?: FindVacanciesFilters
  ): Record<string, unknown> {
    const where: Record<string, unknown> = { tenantId };

    if (filters?.statuses && filters.statuses.length > 0) {
      where.status = { in: filters.statuses };
    }

    if (filters?.recruiterId) {
      where.recruiterId = filters.recruiterId;
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.countryCode) {
      where.countryCode = filters.countryCode;
    }

    if (filters?.search) {
      where.OR = [
        { position: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return where;
  }

  private recordToBaseProps(record: VacancyWithRelations): VacancyProps {
    return {
      id: record.id,
      position: record.position,
      status: record.status as VacancyStatusType,
      recruiterId: record.recruiterId,
      recruiterName: record.recruiter?.name ?? null,
      recruiterEmail: record.recruiter?.email ?? null,
      recruiterAvatar: record.recruiter?.avatar ?? null,
      clientId: record.clientId,
      clientName: record.client?.nombre ?? null,
      saleType: record.saleType as VacancySaleType,
      salaryMin: record.salaryMin,
      salaryMax: record.salaryMax,
      salaryFixed: record.salaryFixed,
      commissions: record.commissions,
      benefits: record.benefits,
      tools: record.tools,
      modality: (record.modality as VacancyModality) ?? null,
      schedule: record.schedule,
      countryCode: record.countryCode,
      regionCode: record.regionCode,
      requiresPsychometry: record.requiresPsychometry,
      checklistValidatedAt: record.checklistValidatedAt,
      checklistValidatedById: record.checklistValidatedById,
      checklistRejectionReason: record.checklistRejectionReason,
      assignedAt: record.assignedAt,
      targetDeliveryDate: record.targetDeliveryDate,
      actualDeliveryDate: record.actualDeliveryDate,
      entryDate: record.entryDate,
      rollbackCount: record.rollbackCount,
      placementConfirmedAt: record.placementConfirmedAt,
      commissionDate: record.commissionDate,
      congratsEmailSent: record.congratsEmailSent,
      tenantId: record.tenantId,
      createdById: record.createdById,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private mapToDomain(record: VacancyWithRelations): Vacancy {
    return new Vacancy(this.recordToBaseProps(record));
  }

  async findById(id: string, tenantId: string): Promise<Vacancy | null> {
    const record = await prisma.vacancy.findUnique({
      where: { id },
      include: this.getDetailInclude(),
    });

    if (!record || record.tenantId !== tenantId) return null;

    // Map related sub-entities into DTOs
    type DetailRecord = typeof record & {
      candidates: Array<{
        id: string; vacancyId: string; firstName: string; lastName: string;
        email: string | null; phone: string | null; isCurrentlyEmployed: boolean | null;
        currentCompany: string | null; currentSalary: number | null;
        salaryExpectation: number | null; currentModality: string | null;
        countryCode: string | null; regionCode: string | null; currentCommissions: string | null;
        currentBenefits: string | null;
        otherBenefits: string | null;
        status: string; isInTerna: boolean; isFinalist: boolean; finalSalary: number | null;
        tenantId: string; createdAt: Date; updatedAt: Date;
        checklistMatches: Array<{
          id: string; candidateId: string; checklistItemId: string;
          rating: string | null; feedback: string | null; tenantId: string; createdAt: Date; updatedAt: Date;
        }>;
        attachments: Array<{
          id: string; fileName: string; fileUrl: string; fileSize: number;
          mimeType: string; subType: string; isValidated: boolean;
          validatedAt: Date | null; validatedById: string | null;
          rejectionReason: string | null; vacancyId: string | null;
          vacancyCandidateId: string | null; uploadedById: string; createdAt: Date;
        }>;
      }>;
      checklistItems: Array<{
        id: string; vacancyId: string; requirement: string; isCompleted: boolean;
        order: number; tenantId: string; createdAt: Date; updatedAt: Date;
        candidateMatches: Array<{
          id: string; candidateId: string; checklistItemId: string;
          rating: string | null; feedback: string | null; tenantId: string; createdAt: Date; updatedAt: Date;
        }>;
      }>;
      statusHistory: Array<{
        id: string; vacancyId: string; previousStatus: string; newStatus: string;
        isRollback: boolean; reason: string | null; newTargetDeliveryDate: Date | null;
        changedById: string; changedBy: { name: string | null }; tenantId: string; createdAt: Date;
      }>;
    };

    const r = record as unknown as DetailRecord;

    const candidates: VacancyCandidateDTO[] = r.candidates.map((c) => ({
      id: c.id, vacancyId: c.vacancyId, firstName: c.firstName, lastName: c.lastName,
      email: c.email, phone: c.phone, isCurrentlyEmployed: c.isCurrentlyEmployed,
      currentCompany: c.currentCompany, currentSalary: c.currentSalary,
      salaryExpectation: c.salaryExpectation,
      currentModality: (c.currentModality as VacancyModality | null) ?? null,
      countryCode: c.countryCode, regionCode: c.regionCode, currentCommissions: c.currentCommissions,
      currentBenefits: c.currentBenefits,
      otherBenefits: c.otherBenefits,
      status: c.status as VacancyCandidateDTO["status"],
      isInTerna: c.isInTerna, isFinalist: c.isFinalist, finalSalary: c.finalSalary,
      tenantId: c.tenantId, createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      checklistMatches: c.checklistMatches.map((m) => ({
        id: m.id, candidateId: m.candidateId, checklistItemId: m.checklistItemId,
        rating: m.rating as ("CUMPLE" | "NO_CUMPLE" | "PARCIAL" | null),
        feedback: m.feedback, tenantId: m.tenantId,
        createdAt: m.createdAt.toISOString(), updatedAt: m.updatedAt.toISOString(),
      })),
      attachments: c.attachments.map((a) => ({
        id: a.id, fileName: a.fileName, fileUrl: a.fileUrl, fileSize: a.fileSize,
        mimeType: a.mimeType, subType: a.subType as AttachmentDTO["subType"],
        isValidated: a.isValidated, validatedAt: a.validatedAt?.toISOString() ?? null,
        validatedById: a.validatedById, rejectionReason: a.rejectionReason,
        vacancyId: a.vacancyId, vacancyCandidateId: a.vacancyCandidateId,
        uploadedById: a.uploadedById, createdAt: a.createdAt.toISOString(),
      })),
    }));

    const checklistItems: VacancyChecklistItemDTO[] = r.checklistItems.map((item) => ({
      id: item.id, vacancyId: item.vacancyId, requirement: item.requirement,
      isCompleted: item.isCompleted, order: item.order, tenantId: item.tenantId,
      createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(),
    }));

    const statusHistory: VacancyStatusHistoryDTO[] = r.statusHistory.map((h) => ({
      id: h.id, vacancyId: h.vacancyId,
      previousStatus: h.previousStatus as VacancyStatusHistoryDTO["previousStatus"],
      newStatus: h.newStatus as VacancyStatusHistoryDTO["newStatus"],
      isRollback: h.isRollback, reason: h.reason,
      newTargetDeliveryDate: h.newTargetDeliveryDate?.toISOString() ?? null,
      changedById: h.changedById, changedByName: h.changedBy?.name ?? null,
      tenantId: h.tenantId, createdAt: h.createdAt.toISOString(),
    }));

    return new Vacancy({
      ...this.recordToBaseProps(r as unknown as VacancyWithRelations),
      candidates,
      checklistItems,
      statusHistory,
    });
  }

  async findByTenantId(
    tenantId: string,
    filters?: FindVacanciesFilters
  ): Promise<Vacancy[]> {
    const records = await prisma.vacancy.findMany({
      where: this.buildWhereClause(tenantId, filters),
      include: this.getBaseInclude(),
      orderBy: { assignedAt: "desc" },
    });

    return records.map((r) =>
      this.mapToDomain(r as unknown as VacancyWithRelations)
    );
  }

  async findByClientId(
    clientId: string,
    tenantId: string
  ): Promise<Vacancy[]> {
    const records = await prisma.vacancy.findMany({
      where: { clientId, tenantId },
      include: this.getBaseInclude(),
      orderBy: { assignedAt: "desc" },
    });

    return records.map((r) =>
      this.mapToDomain(r as unknown as VacancyWithRelations)
    );
  }

  async create(data: CreateVacancyData): Promise<Vacancy> {
    const record = await prisma.vacancy.create({
      data: {
        position: data.position,
        recruiterId: data.recruiterId,
        clientId: data.clientId,
        saleType: data.saleType,
        salaryMin: data.salaryMin ?? null,
        salaryMax: data.salaryMax ?? null,
        salaryFixed: data.salaryFixed ?? null,
        commissions: data.commissions ?? null,
        benefits: data.benefits ?? null,
        tools: data.tools ?? null,
        modality: data.modality ?? null,
        schedule: data.schedule ?? null,
        countryCode: data.countryCode ?? null,
        regionCode: data.regionCode ?? null,
        requiresPsychometry: data.requiresPsychometry ?? false,
        targetDeliveryDate: data.targetDeliveryDate ?? null,
        assignedAt: new Date(),
        status: "QUICK_MEETING",
        tenantId: data.tenantId,
        createdById: data.createdById ?? null,
      },
      include: this.getBaseInclude(),
    });

    return this.mapToDomain(record as unknown as VacancyWithRelations);
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateVacancyData
  ): Promise<Vacancy | null> {
    const result = await prisma.vacancy.updateMany({
      where: { id, tenantId },
      data: {
        ...(data.position !== undefined && { position: data.position }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.salaryMin !== undefined && { salaryMin: data.salaryMin }),
        ...(data.salaryMax !== undefined && { salaryMax: data.salaryMax }),
        ...(data.salaryFixed !== undefined && { salaryFixed: data.salaryFixed }),
        ...(data.commissions !== undefined && {
          commissions: data.commissions,
        }),
        ...(data.benefits !== undefined && { benefits: data.benefits }),
        ...(data.tools !== undefined && { tools: data.tools }),
        ...(data.modality !== undefined && { modality: data.modality }),
        ...(data.schedule !== undefined && { schedule: data.schedule }),
        ...(data.countryCode !== undefined && {
          countryCode: data.countryCode,
        }),
        ...(data.regionCode !== undefined && { regionCode: data.regionCode }),
        ...(data.requiresPsychometry !== undefined && {
          requiresPsychometry: data.requiresPsychometry,
        }),
        ...(data.targetDeliveryDate !== undefined && {
          targetDeliveryDate: data.targetDeliveryDate,
        }),
        ...(data.actualDeliveryDate !== undefined && {
          actualDeliveryDate: data.actualDeliveryDate,
        }),
        ...(data.entryDate !== undefined && { entryDate: data.entryDate }),
        ...(data.rollbackCount !== undefined && {
          rollbackCount: data.rollbackCount,
        }),
        ...(data.placementConfirmedAt !== undefined && {
          placementConfirmedAt: data.placementConfirmedAt,
        }),
        ...(data.commissionDate !== undefined && {
          commissionDate: data.commissionDate,
        }),
        ...(data.congratsEmailSent !== undefined && {
          congratsEmailSent: data.congratsEmailSent,
        }),
        ...(data.checklistValidatedAt !== undefined && {
          checklistValidatedAt: data.checklistValidatedAt,
        }),
        ...(data.checklistValidatedById !== undefined && {
          checklistValidatedById: data.checklistValidatedById,
        }),
        ...(data.checklistRejectionReason !== undefined && {
          checklistRejectionReason: data.checklistRejectionReason,
        }),
      },
    });

    if (result.count === 0) return null;

    const updated = await prisma.vacancy.findUnique({
      where: { id },
      include: this.getBaseInclude(),
    });

    if (!updated) return null;
    return this.mapToDomain(updated as unknown as VacancyWithRelations);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await prisma.vacancy.deleteMany({
      where: { id, tenantId },
    });
    return result.count > 0;
  }

  async count(
    tenantId: string,
    filters?: FindVacanciesFilters
  ): Promise<number> {
    return prisma.vacancy.count({
      where: this.buildWhereClause(tenantId, filters),
    });
  }

  async findPaginated(
    params: FindPaginatedVacanciesParams
  ): Promise<PaginatedResult<Vacancy>> {
    const { tenantId, skip, take, sorting, filters } = params;
    const where = this.buildWhereClause(tenantId, filters);

    let orderBy: Record<string, string> = { assignedAt: "desc" };

    if (sorting && sorting.length > 0) {
      const sort = sorting[0];
      if (sort && ALLOWED_ORDER_FIELDS.includes(sort.id)) {
        orderBy = { [sort.id]: sort.desc ? "desc" : "asc" };
      }
    }

    const [totalCount, records] = await Promise.all([
      prisma.vacancy.count({ where }),
      prisma.vacancy.findMany({
        where,
        include: this.getBaseInclude(),
        orderBy,
        skip,
        take,
      }),
    ]);

    return {
      data: records.map((r) =>
        this.mapToDomain(r as unknown as VacancyWithRelations)
      ),
      totalCount,
    };
  }

  async countByClientId(clientId: string, tenantId: string): Promise<number> {
    return prisma.vacancy.count({ where: { clientId, tenantId } });
  }

  async findRecruiterContactById(userId: string): Promise<{ email: string; name: string | null } | null> {
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { email: true, name: true },
    });
    return user ?? null;
  }

  async findClientNameById(clientId: string, tenantId: string): Promise<string | null> {
    const client = await prisma.client.findFirst({
      where: { id: clientId, tenantId },
      select: { nombre: true },
    });
    return client?.nombre ?? null;
  }

  async validateChecklist(
    vacancyId: string,
    tenantId: string,
    validatedById: string,
  ): Promise<ChecklistValidationResult> {
    const v = await prisma.vacancy.update({
      where: { id: vacancyId, tenantId },
      data: {
        checklistValidatedAt: new Date(),
        checklistValidatedById: validatedById,
        checklistRejectionReason: null,
      },
      select: {
        id: true,
        checklistValidatedAt: true,
        checklistValidatedById: true,
        checklistRejectionReason: true,
      },
    });
    return {
      id: v.id,
      checklistValidatedAt: v.checklistValidatedAt?.toISOString() ?? null,
      checklistValidatedById: v.checklistValidatedById,
      checklistRejectionReason: v.checklistRejectionReason,
    };
  }

  async rejectChecklist(
    vacancyId: string,
    tenantId: string,
    reason: string,
  ): Promise<ChecklistValidationResult> {
    const v = await prisma.vacancy.update({
      where: { id: vacancyId, tenantId },
      data: {
        checklistValidatedAt: null,
        checklistValidatedById: null,
        checklistRejectionReason: reason,
      },
      select: {
        id: true,
        checklistValidatedAt: true,
        checklistValidatedById: true,
        checklistRejectionReason: true,
      },
    });
    return {
      id: v.id,
      checklistValidatedAt: null,
      checklistValidatedById: null,
      checklistRejectionReason: v.checklistRejectionReason,
    };
  }
}

export const prismaVacancyRepository = new PrismaVacancyRepository();
