import prisma from "@lib/prisma";
import { Lead, type LeadProps } from "../../domain/entities/Lead";
import type { LeadStatusType } from "../../domain/value-objects/LeadStatus";
import type {
  ILeadRepository,
  CreateLeadData,
  UpdateLeadData,
  FindLeadsFilters,
  FindPaginatedParams,
  PaginatedResult,
} from "../../domain/interfaces/ILeadRepository";

/**
 * Implementación del repositorio de Leads usando Prisma
 * Capa de infraestructura - acceso a datos
 */
export class PrismaLeadRepository implements ILeadRepository {
  private mapToDomain(lead: {
    id: string;
    companyName: string;
    website: string | null;
    linkedInUrl: string | null;
    address: string | null;
    subOrigin: string | null;
    employeeCount: string | null;
    notes: string | null;
    status: string;
    sectorId: string | null;
    sector?: { name: string } | null;
    subsectorId: string | null;
    subsector?: { name: string } | null;
    originId: string | null;
    origin?: { name: string } | null;
    assignedToId: string | null;
    assignedTo?: { name: string | null } | null;
    isDeleted: boolean;
    deletedAt: Date | null;
    tenantId: string;
    createdById: string | null;
    createdBy?: { name: string | null } | null;
    createdAt: Date;
    updatedAt: Date;
    _count?: { contacts: number };
  }): Lead {
    const props: LeadProps = {
      id: lead.id,
      companyName: lead.companyName,
      website: lead.website,
      linkedInUrl: lead.linkedInUrl,
      address: lead.address,
      subOrigin: lead.subOrigin,
      employeeCount: lead.employeeCount,
      notes: lead.notes,
      status: lead.status as LeadStatusType,
      sectorId: lead.sectorId,
      sectorName: lead.sector?.name,
      subsectorId: lead.subsectorId,
      subsectorName: lead.subsector?.name,
      originId: lead.originId,
      originName: lead.origin?.name,
      assignedToId: lead.assignedToId,
      assignedToName: lead.assignedTo?.name,
      isDeleted: lead.isDeleted,
      deletedAt: lead.deletedAt,
      tenantId: lead.tenantId,
      createdById: lead.createdById,
      createdByName: lead.createdBy?.name,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      contactsCount: lead._count?.contacts,
    };
    return new Lead(props);
  }

  private getBaseInclude() {
    return {
      sector: { select: { name: true } },
      subsector: { select: { name: true } },
      origin: { select: { name: true } },
      assignedTo: { select: { name: true } },
      createdBy: { select: { name: true } },
      _count: { select: { contacts: true } },
    };
  }

  /**
   * Minimal include for Kanban cards - only essential relations
   * Reduces query payload for faster loading
   */
  private getMinimalInclude() {
    return {
      sector: { select: { name: true } },
      assignedTo: { select: { name: true } },
      _count: { select: { contacts: true } },
    };
  }

  async findById(id: string, tenantId: string): Promise<Lead | null> {
    const lead = await prisma.lead.findFirst({
      where: { id, tenantId },
      include: this.getBaseInclude(),
    });

    if (!lead) return null;
    return this.mapToDomain(lead);
  }

  async findByTenantId(
    tenantId: string,
    filters?: FindLeadsFilters,
  ): Promise<Lead[]> {
    const where = this.buildWhereClause(tenantId, filters);

    const leads = await prisma.lead.findMany({
      where,
      include: this.getBaseInclude(),
      orderBy: { createdAt: "desc" },
    });

    return leads.map((lead) => this.mapToDomain(lead));
  }

  async create(data: CreateLeadData): Promise<Lead> {
    const lead = await prisma.lead.create({
      data: {
        companyName: data.companyName,
        website: data.website || null,
        linkedInUrl: data.linkedInUrl || null,
        address: data.address || null,
        subOrigin: data.subOrigin || null,
        employeeCount: data.employeeCount || null,
        notes: data.notes || null,
        status: data.status || "CONTACTO",
        sectorId: data.sectorId || null,
        subsectorId: data.subsectorId || null,
        originId: data.originId || null,
        assignedToId: data.assignedToId || null,
        tenantId: data.tenantId,
        createdById: data.createdById || null,
      },
      include: this.getBaseInclude(),
    });

    return this.mapToDomain(lead);
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateLeadData,
  ): Promise<Lead | null> {
    try {
      // Operación atómica: verifica tenantId y actualiza
      const result = await prisma.lead.updateMany({
        where: { id, tenantId, isDeleted: false },
        data: {
          ...(data.companyName !== undefined && {
            companyName: data.companyName,
          }),
          ...(data.website !== undefined && { website: data.website }),
          ...(data.linkedInUrl !== undefined && {
            linkedInUrl: data.linkedInUrl,
          }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.subOrigin !== undefined && { subOrigin: data.subOrigin }),
          ...(data.employeeCount !== undefined && {
            employeeCount: data.employeeCount,
          }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.sectorId !== undefined && { sectorId: data.sectorId }),
          ...(data.subsectorId !== undefined && {
            subsectorId: data.subsectorId,
          }),
          ...(data.originId !== undefined && { originId: data.originId }),
          ...(data.assignedToId !== undefined && {
            assignedToId: data.assignedToId,
          }),
        },
      });

      if (result.count === 0) {
        return null;
      }

      const lead = await prisma.lead.findFirst({
        where: { id, tenantId },
        include: this.getBaseInclude(),
      });

      if (!lead) return null;
      return this.mapToDomain(lead);
    } catch (error) {
      console.error("Error updating lead:", error);
      return null;
    }
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: LeadStatusType,
    _userId: string,
  ): Promise<Lead | null> {
    try {
      const result = await prisma.lead.updateMany({
        where: { id, tenantId, isDeleted: false },
        data: { status },
      });

      if (result.count === 0) {
        return null;
      }

      const lead = await prisma.lead.findFirst({
        where: { id, tenantId },
        include: this.getBaseInclude(),
      });

      if (!lead) return null;
      return this.mapToDomain(lead);
    } catch (error) {
      console.error("Error updating lead status:", error);
      return null;
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    try {
      // Soft delete
      const result = await prisma.lead.updateMany({
        where: { id, tenantId, isDeleted: false },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      return result.count > 0;
    } catch (error) {
      console.error("Error deleting lead:", error);
      return false;
    }
  }

  async restore(id: string, tenantId: string): Promise<boolean> {
    try {
      const result = await prisma.lead.updateMany({
        where: { id, tenantId, isDeleted: true },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
      });

      return result.count > 0;
    } catch (error) {
      console.error("Error restoring lead:", error);
      return false;
    }
  }

  async count(tenantId: string, filters?: FindLeadsFilters): Promise<number> {
    const where = this.buildWhereClause(tenantId, filters);
    return prisma.lead.count({ where });
  }

  async findPaginated(
    params: FindPaginatedParams,
  ): Promise<PaginatedResult<Lead>> {
    const { tenantId, skip, take, sorting, filters, minimal } = params;
    const where = this.buildWhereClause(tenantId, filters);

    // Whitelist de columnas permitidas para prevenir inyección
    const allowedSortColumns = [
      "companyName",
      "status",
      "createdAt",
      "updatedAt",
    ];

    const orderBy =
      sorting && sorting.length > 0
        ? sorting
            .filter((s) => allowedSortColumns.includes(s.id))
            .map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" as const }];

    // Use minimal includes for Kanban queries to reduce payload
    const include = minimal ? this.getMinimalInclude() : this.getBaseInclude();

    const [totalCount, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        include,
        orderBy,
        skip,
        take,
      }),
    ]);

    return {
      data: leads.map((lead) => this.mapToDomain(lead)),
      totalCount,
    };
  }

  private buildWhereClause(
    tenantId: string,
    filters?: FindLeadsFilters,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {
      tenantId,
      isDeleted: filters?.isDeleted ?? false,
    };

    if (filters?.statuses?.length) {
      where.status = { in: filters.statuses };
    }

    if (filters?.sectorIds?.length) {
      where.sectorId = { in: filters.sectorIds };
    }

    if (filters?.originIds?.length) {
      where.originId = { in: filters.originIds };
    }

    if (filters?.assignedToIds?.length) {
      where.assignedToId = { in: filters.assignedToIds };
    }

    // Filtro por numero de empleados (match exacto en rangos de string)
    if (filters?.employeeCounts?.length) {
      where.employeeCount = { in: filters.employeeCounts };
    }

    // Filtro por rango de fechas (inclusivo)
    if (filters?.createdAtFrom || filters?.createdAtTo) {
      where.createdAt = {
        ...(filters.createdAtFrom && { gte: filters.createdAtFrom }),
        ...(filters.createdAtTo && { lte: filters.createdAtTo }),
      };
    }

    if (filters?.search) {
      where.OR = [
        { companyName: { contains: filters.search, mode: "insensitive" } },
        { notes: { contains: filters.search, mode: "insensitive" } },
        { address: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return where;
  }

  async reasignLead(
    leadId: string,
    newUserId: string,
    tenantId: string,
  ): Promise<Lead | null> {
    try {
      // Verificar que el lead pertenece al tenant
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, tenantId, isDeleted: false },
      });

      if (!lead) {
        return null;
      }

      // Verificar que el nuevo usuario pertenece al tenant (via UserRole)
      const userBelongsToTenant = await prisma.userRole.findFirst({
        where: { userId: newUserId, tenantId },
      });

      if (!userBelongsToTenant) {
        return null;
      }

      const result = await prisma.lead.update({
        where: { id: leadId },
        data: { assignedToId: newUserId },
        include: this.getBaseInclude(),
      });

      return this.mapToDomain(result);
    } catch (error) {
      console.error("Error reassigning lead:", error);
      return null;
    }
  }
}

// Singleton instance
export const prismaLeadRepository = new PrismaLeadRepository();
