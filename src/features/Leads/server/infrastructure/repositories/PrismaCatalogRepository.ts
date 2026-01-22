import prisma from "@lib/prisma";
import type {
  ISectorRepository,
  ISubsectorRepository,
  ILeadOriginRepository,
  Sector,
  Subsector,
  LeadOrigin,
} from "../../domain/interfaces/ICatalogRepository";

/**
 * Implementación del repositorio de Sectors usando Prisma
 */
export class PrismaSectorRepository implements ISectorRepository {
  async findActive(tenantId: string): Promise<Sector[]> {
    const sectors = await prisma.sector.findMany({
      where: {
        isActive: true,
        OR: [{ tenantId: null }, { tenantId }],
      },
      orderBy: { name: "asc" },
    });

    return sectors.map((sector) => ({
      id: sector.id,
      name: sector.name,
      isActive: sector.isActive,
      tenantId: sector.tenantId,
    }));
  }

  async findById(id: string): Promise<Sector | null> {
    const sector = await prisma.sector.findUnique({
      where: { id },
    });

    if (!sector) return null;

    return {
      id: sector.id,
      name: sector.name,
      isActive: sector.isActive,
      tenantId: sector.tenantId,
    };
  }
}

/**
 * Implementación del repositorio de Subsectors usando Prisma
 */
export class PrismaSubsectorRepository implements ISubsectorRepository {
  async findBySectorId(sectorId: string): Promise<Subsector[]> {
    const subsectors = await prisma.subsector.findMany({
      where: {
        sectorId,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    return subsectors.map((subsector) => ({
      id: subsector.id,
      name: subsector.name,
      sectorId: subsector.sectorId,
      isActive: subsector.isActive,
      tenantId: subsector.tenantId,
    }));
  }

  async findById(id: string): Promise<Subsector | null> {
    const subsector = await prisma.subsector.findUnique({
      where: { id },
    });

    if (!subsector) return null;

    return {
      id: subsector.id,
      name: subsector.name,
      sectorId: subsector.sectorId,
      isActive: subsector.isActive,
      tenantId: subsector.tenantId,
    };
  }
}

/**
 * Implementación del repositorio de LeadOrigins usando Prisma
 */
export class PrismaLeadOriginRepository implements ILeadOriginRepository {
  async findActive(tenantId: string): Promise<LeadOrigin[]> {
    const origins = await prisma.leadOrigin.findMany({
      where: {
        isActive: true,
        OR: [{ tenantId: null }, { tenantId }],
      },
      orderBy: { name: "asc" },
    });

    return origins.map((origin) => ({
      id: origin.id,
      name: origin.name,
      description: origin.description,
      isActive: origin.isActive,
      tenantId: origin.tenantId,
    }));
  }

  async findById(id: string): Promise<LeadOrigin | null> {
    const origin = await prisma.leadOrigin.findUnique({
      where: { id },
    });

    if (!origin) return null;

    return {
      id: origin.id,
      name: origin.name,
      description: origin.description,
      isActive: origin.isActive,
      tenantId: origin.tenantId,
    };
  }
}

// Singleton instances
export const prismaSectorRepository = new PrismaSectorRepository();
export const prismaSubsectorRepository = new PrismaSubsectorRepository();
export const prismaLeadOriginRepository = new PrismaLeadOriginRepository();
