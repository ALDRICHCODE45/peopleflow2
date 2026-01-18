import prisma from "@lib/prisma";
import { Role } from "../../domain/entities/Role";
import { IRoleRepository } from "../../domain/interfaces/IRoleRepository";

/**
 * Implementación del repositorio de Roles usando Prisma
 * Capa de infraestructura - acceso a datos
 */

export class PrismaRoleRepository implements IRoleRepository {
  async findById(id: string): Promise<Role | null> {
    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) return null;

    return new Role({
      id: role.id,
      name: role.name,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    });
  }

  async findByName(name: string, tenantId?: string | null): Promise<Role | null> {
    const role = await prisma.role.findFirst({
      where: { name, tenantId: tenantId ?? null },
    });

    if (!role) return null;

    return new Role({
      id: role.id,
      name: role.name,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    });
  }

  async findUserRoleInTenant(userId: string, tenantId: string | null): Promise<Role | null> {
    if (!tenantId) {
      // Si no hay tenantId, verificar si es superadmin global
      const superAdminRole = await prisma.role.findFirst({
        where: { name: "superadmin", tenantId: null },
      });

      if (superAdminRole) {
        const userRole = await prisma.userRole.findFirst({
          where: {
            userId,
            roleId: superAdminRole.id,
            tenantId: null,
          },
          include: {
            role: true,
          },
        });

        if (userRole) {
          return new Role({
            id: userRole.role.id,
            name: userRole.role.name,
            createdAt: userRole.role.createdAt,
            updatedAt: userRole.role.updatedAt,
          });
        }
      }

      return null;
    }

    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        tenantId,
      },
      include: {
        role: true,
      },
    });

    if (!userRole) return null;

    return new Role({
      id: userRole.role.id,
      name: userRole.role.name,
      createdAt: userRole.role.createdAt,
      updatedAt: userRole.role.updatedAt,
    });
  }

  async hasGlobalRole(userId: string, roleId: string): Promise<boolean> {
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        tenantId: null,
      },
    });

    return !!userRole;
  }


  async findByTenantId(tenantId:string):Promise<Role[]> {
    const roles = await prisma.role.findMany({
      where:{
        tenantId
      }
    })

    return roles.map(
      (role) =>
        new Role({
          id: role.id,
          name: role.name,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        })
    );
  }


  async findAll(): Promise<Role[]> {
    const roles = await prisma.role.findMany();

    return roles.map(
      (role) =>
        new Role({
          id: role.id,
          name: role.name,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        })
    );
  }
}

// Singleton instance
export const prismaRoleRepository = new PrismaRoleRepository();
