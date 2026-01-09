import prisma from "@lib/prisma";
import { Tenant } from "../../domain/entities/Tenant";
import {
  ITenantRepository,
  TenantWithRoles,
  CreateTenantData,
} from "../../domain/interfaces/ITenantRepository";

/**
 * Implementación del repositorio de Tenants usando Prisma
 * Capa de infraestructura - acceso a datos
 */

export class PrismaTenantRepository implements ITenantRepository {
  async findById(id: string): Promise<Tenant | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) return null;

    return new Tenant({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    });
  }

  async findByName(name: string): Promise<Tenant | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { name },
    });

    if (!tenant) return null;

    return new Tenant({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    });
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) return null;

    return new Tenant({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    });
  }

  async findByNameOrSlug(name: string, slug: string): Promise<Tenant | null> {
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    });

    if (!tenant) return null;

    return new Tenant({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    });
  }

  async findByUserId(userId: string): Promise<TenantWithRoles[]> {
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        tenantId: { not: null }, // Excluir roles sin tenant (superadmin global)
      },
      include: {
        tenant: true,
        role: true,
      },
    });

    // Agrupar por tenant y obtener roles únicos
    const tenantMap = new Map<string, TenantWithRoles>();

    for (const userRole of userRoles) {
      if (!userRole.tenant) continue;

      const tenantId = userRole.tenant.id;
      if (!tenantMap.has(tenantId)) {
        tenantMap.set(tenantId, {
          id: userRole.tenant.id,
          name: userRole.tenant.name,
          slug: userRole.tenant.slug,
          createdAt: userRole.tenant.createdAt,
          updatedAt: userRole.tenant.updatedAt,
          roles: [],
        });
      }

      tenantMap.get(tenantId)!.roles.push({
        id: userRole.role.id,
        name: userRole.role.name,
      });
    }

    return Array.from(tenantMap.values());
  }

  async create(data: CreateTenantData): Promise<Tenant> {
    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
      },
    });

    return new Tenant({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    });
  }

  async getActiveTenantBySessionToken(
    sessionToken: string,
  ): Promise<Tenant | null> {
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        activeTenant: true,
      },
    });

    if (!session?.activeTenant) return null;

    return new Tenant({
      id: session.activeTenant.id,
      name: session.activeTenant.name,
      slug: session.activeTenant.slug,
      createdAt: session.activeTenant.createdAt,
      updatedAt: session.activeTenant.updatedAt,
    });
  }

  async updateSessionActiveTenant(
    sessionToken: string,
    tenantId: string | null,
  ): Promise<boolean> {
    try {
      await prisma.session.update({
        where: { token: sessionToken },
        data: { activeTenantId: tenantId },
      });
      return true;
    } catch (error) {
      console.error("Error updating session active tenant:", error);
      return false;
    }
  }
}

// Singleton instance
export const prismaTenantRepository = new PrismaTenantRepository();
