import prisma from "@lib/prisma";
import { UserRole } from "../../domain/entities/UserRole";
import {
  IUserRoleRepository,
  UserWithRoles,
  CreateUserRoleData,
} from "../../domain/interfaces/IUserRoleRepository";
import { SUPER_ADMIN_PERMISSION_NAME } from "@/core/shared/constants/permissions";

/**
 * Implementación del repositorio de UserRoles usando Prisma
 * Capa de infraestructura - acceso a datos con filtrado por tenantId
 */

export class PrismaUserRoleRepository implements IUserRoleRepository {
  async findById(id: string): Promise<UserRole | null> {
    const userRole = await prisma.userRole.findUnique({
      where: { id },
    });

    if (!userRole) return null;

    return new UserRole({
      id: userRole.id,
      userId: userRole.userId,
      roleId: userRole.roleId,
      tenantId: userRole.tenantId,
      createdAt: userRole.createdAt,
    });
  }

  async exists(
    userId: string,
    roleId: string,
    tenantId: string | null
  ): Promise<boolean> {
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        tenantId,
      },
    });

    return !!userRole;
  }

  async create(data: CreateUserRoleData): Promise<UserRole> {
    const userRole = await prisma.userRole.create({
      data: {
        userId: data.userId,
        roleId: data.roleId,
        tenantId: data.tenantId,
      },
    });

    return new UserRole({
      id: userRole.id,
      userId: userRole.userId,
      roleId: userRole.roleId,
      tenantId: userRole.tenantId,
      createdAt: userRole.createdAt,
    });
  }

  async findUsersByTenantId(tenantId: string): Promise<UserWithRoles[]> {
    // Obtener usuarios del tenant con filtrado explícito por tenantId
    const userRoles = await prisma.userRole.findMany({
      where: {
        tenantId, // Filtrado obligatorio por tenantId
      },
      include: {
        user: true,
        role: true,
      },
    });

    // Agrupar por usuario y roles
    const userMap = new Map<string, UserWithRoles>();

    for (const userRole of userRoles) {
      const userId = userRole.userId;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          id: userRole.user.id,
          email: userRole.user.email,
          name: userRole.user.name,
          roles: [],
        });
      }
      userMap.get(userId)!.roles.push({
        id: userRole.role.id,
        name: userRole.role.name,
      });
    }

    return Array.from(userMap.values());
  }

  async userBelongsToTenant(
    userId: string,
    tenantId: string
  ): Promise<boolean> {
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        tenantId, // Filtrado obligatorio por tenantId
      },
    });

    return !!userRole;
  }

  /**
   * Verifica si el usuario tiene el permiso super:admin
   *
   * Busca si alguno de los roles del usuario tiene asignado el permiso super:admin
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    // Buscar el permiso super:admin
    const superAdminPermission = await prisma.permission.findUnique({
      where: { name: SUPER_ADMIN_PERMISSION_NAME },
    });

    if (!superAdminPermission) {
      return false;
    }

    // Buscar si el usuario tiene algún rol con el permiso super:admin
    const userRoleWithSuperAdmin = await prisma.userRole.findFirst({
      where: {
        userId,
        role: {
          permissions: {
            some: {
              permissionId: superAdminPermission.id,
            },
          },
        },
      },
    });

    return !!userRoleWithSuperAdmin;
  }

  /**
   * Obtiene todos los permisos de un usuario en un tenant específico
   */
  async getUserPermissions(
    userId: string,
    tenantId: string | null
  ): Promise<string[]> {
    // Obtener roles del usuario
    const whereClause: {
      userId: string;
      tenantId?: string | null;
    } = { userId };

    // Si hay tenantId, filtrar por él
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const userRoles = await prisma.userRole.findMany({
      where: whereClause,
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Si no encontramos roles en el tenant, buscar roles globales
    if (userRoles.length === 0 && tenantId) {
      const globalRoles = await prisma.userRole.findMany({
        where: {
          userId,
          tenantId: null,
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      const permissionSet = new Set<string>();
      for (const userRole of globalRoles) {
        for (const rolePermission of userRole.role.permissions) {
          permissionSet.add(rolePermission.permission.name);
        }
      }
      return Array.from(permissionSet);
    }

    // Extraer permisos únicos
    const permissionSet = new Set<string>();
    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        permissionSet.add(rolePermission.permission.name);
      }
    }

    return Array.from(permissionSet);
  }
}

// Singleton instance
export const prismaUserRoleRepository = new PrismaUserRoleRepository();
