import prisma from "@lib/prisma";
import {
  VacancyChecklistItem,
  type VacancyChecklistItemProps,
} from "../../domain/entities/VacancyChecklistItem";
import type {
  IVacancyChecklistRepository,
  CreateChecklistItemData,
  UpdateChecklistItemData,
} from "../../domain/interfaces/IVacancyChecklistRepository";

type PrismaChecklistRecord = {
  id: string;
  vacancyId: string;
  requirement: string;
  isCompleted: boolean;
  order: number;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
};

export class PrismaVacancyChecklistRepository
  implements IVacancyChecklistRepository
{
  private mapToDomain(
    record: PrismaChecklistRecord
  ): VacancyChecklistItem {
    const props: VacancyChecklistItemProps = {
      id: record.id,
      vacancyId: record.vacancyId,
      requirement: record.requirement,
      isCompleted: record.isCompleted,
      order: record.order,
      tenantId: record.tenantId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
    return new VacancyChecklistItem(props);
  }

  async findById(
    id: string,
    tenantId: string
  ): Promise<VacancyChecklistItem | null> {
    const record = await prisma.vacancyChecklistItem.findUnique({
      where: { id },
    });

    if (!record || record.tenantId !== tenantId) return null;
    return this.mapToDomain(record as unknown as PrismaChecklistRecord);
  }

  async findByVacancyId(
    vacancyId: string,
    tenantId: string
  ): Promise<VacancyChecklistItem[]> {
    const records = await prisma.vacancyChecklistItem.findMany({
      where: { vacancyId, tenantId },
      orderBy: { order: "asc" },
    });

    return records.map((r) =>
      this.mapToDomain(r as unknown as PrismaChecklistRecord)
    );
  }

  async create(data: CreateChecklistItemData): Promise<VacancyChecklistItem> {
    const record = await prisma.vacancyChecklistItem.create({
      data: {
        vacancyId: data.vacancyId,
        requirement: data.requirement,
        isCompleted: false,
        order: data.order ?? 0,
        tenantId: data.tenantId,
      },
    });

    return this.mapToDomain(record as unknown as PrismaChecklistRecord);
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateChecklistItemData
  ): Promise<VacancyChecklistItem | null> {
    const result = await prisma.vacancyChecklistItem.updateMany({
      where: { id, tenantId },
      data: {
        ...(data.requirement !== undefined && {
          requirement: data.requirement,
        }),
        ...(data.isCompleted !== undefined && {
          isCompleted: data.isCompleted,
        }),
        ...(data.order !== undefined && { order: data.order }),
      },
    });

    if (result.count === 0) return null;

    const updated = await prisma.vacancyChecklistItem.findUnique({
      where: { id },
    });

    if (!updated) return null;
    return this.mapToDomain(updated as unknown as PrismaChecklistRecord);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await prisma.vacancyChecklistItem.deleteMany({
      where: { id, tenantId },
    });
    return result.count > 0;
  }

  async countByVacancyId(
    vacancyId: string,
    tenantId: string
  ): Promise<number> {
    return prisma.vacancyChecklistItem.count({
      where: { vacancyId, tenantId },
    });
  }
}

export const prismaVacancyChecklistRepository =
  new PrismaVacancyChecklistRepository();
