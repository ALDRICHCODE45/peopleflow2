import prisma from "@lib/prisma";
import type { LeadStatusType } from "../../domain/value-objects/LeadStatus";
import type {
  ILeadStatusHistoryRepository,
  LeadStatusHistoryItem,
  CreateLeadStatusHistoryData,
} from "../../domain/interfaces/ILeadStatusHistoryRepository";

/**
 * Implementación del repositorio de LeadStatusHistory usando Prisma
 * Capa de infraestructura - acceso a datos
 */
export class PrismaLeadStatusHistoryRepository implements ILeadStatusHistoryRepository {
  private mapToDomain(history: {
    id: string;
    leadId: string;
    previousStatus: string;
    newStatus: string;
    changedById: string;
    changedBy?: { name: string | null } | null;
    tenantId: string;
    createdAt: Date;
  }): LeadStatusHistoryItem {
    return {
      id: history.id,
      leadId: history.leadId,
      previousStatus: history.previousStatus as LeadStatusType,
      newStatus: history.newStatus as LeadStatusType,
      changedById: history.changedById,
      changedByName: history.changedBy?.name ?? undefined,
      tenantId: history.tenantId,
      createdAt: history.createdAt,
    };
  }

  async create(data: CreateLeadStatusHistoryData): Promise<LeadStatusHistoryItem> {
    const history = await prisma.leadStatusHistory.create({
      data: {
        leadId: data.leadId,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
        changedById: data.changedById,
        tenantId: data.tenantId,
      },
      include: { changedBy: { select: { name: true } } },
    });

    return this.mapToDomain(history);
  }

  async findByLeadId(leadId: string, tenantId: string): Promise<LeadStatusHistoryItem[]> {
    const history = await prisma.leadStatusHistory.findMany({
      where: { leadId, tenantId },
      include: { changedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return history.map((h) => this.mapToDomain(h));
  }

  async countByLeadId(leadId: string, tenantId: string): Promise<number> {
    return prisma.leadStatusHistory.count({
      where: { leadId, tenantId },
    });
  }
}

// Singleton instance
export const prismaLeadStatusHistoryRepository = new PrismaLeadStatusHistoryRepository();
