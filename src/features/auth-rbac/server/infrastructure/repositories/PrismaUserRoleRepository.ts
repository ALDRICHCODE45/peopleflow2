import prisma from "@lib/prisma";
import { UserRole } from "../../domain/entities/UserRole";
import {
  IUserRoleRepository,
  UserWithRoles,
  CreateUserRoleData,
  FindPaginatedUsersParams,
  PaginatedUsersResult,
} from "../../domain/interfaces/IUserRoleRepository";
import { SUPER_ADMIN_PERMISSION_NAME } from "@/core/shared/constants/permissions";
import { Prisma } from "@/core/generated/prisma/client";

/**
 * Implementación del repositorio de UserRoles usando Prisma
 * Capa de infraestructura - acceso a datos con filtrado por tenantId
 */

export class PrismaUserRoleRepository implements IUserRoleRepository {
  /**
   * Encuentra un UserRole por su ID con filtrado obligatorio de tenant
   * SEGURIDAD: Previene acceso cross-tenant (IDOR)
   */
  async findById(
    id: string,
    tenantId: string | null
  ): Promise<UserRole | null> {
    const userRole = await prisma.userRole.findFirst({
      where: {
        id,
        tenantId, // Filtrado OBLIGATORIO por tenant
      },
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
          image: userRole.user.image,
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

  async findUserById(
    userId: string
  ): Promise<{ name: string; id: string; image: string | null; email: string } | null> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) return null;

    return {
      name: user.name ?? "",
      image: user.image,
      email: user.email,
      id: user.id,
    };
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
   *
   * SEGURIDAD: Este método implementa aislamiento estricto de datos entre tenants:
   * - SuperAdmin: Obtiene permisos de sus roles globales (tenantId = null)
   * - Usuario normal: SOLO obtiene permisos del tenant especificado
   * - Sin tenant: Retorna array vacío (fail-closed)
   */
  async getUserPermissions(
    userId: string,
    tenantId: string | null
  ): Promise<string[]> {
    // PASO 1: Verificar primero si es SuperAdmin
    const isSuperAdmin = await this.isSuperAdmin(userId);

    if (isSuperAdmin) {
      // SuperAdmin: Obtener permisos de roles globales (sin tenant)
      const globalRoles = await prisma.userRole.findMany({
        where: {
          userId,
          tenantId: null, // Roles globales de superadmin
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

      return this.extractPermissionsFromRoles(globalRoles);
    }

    // PASO 2: Usuario normal - Requiere tenantId obligatorio
    // FAIL-CLOSED: Sin tenant, sin permisos
    if (!tenantId) {
      return [];
    }

    // PASO 3: Obtener SOLO permisos del tenant específico
    // NO hay fallback a roles globales para usuarios normales
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        tenantId, // Filtrado ESTRICTO por tenant
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

    return this.extractPermissionsFromRoles(userRoles);
  }

  /**
   * Extrae los nombres de permisos únicos de un array de UserRoles
   * Método privado para evitar duplicación de código (DRY)
   */
  private extractPermissionsFromRoles(
    userRoles: Array<{
      role: {
        permissions: Array<{
          permission: {
            name: string;
          };
        }>;
      };
    }>
  ): string[] {
    const permissionSet = new Set<string>();

    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        permissionSet.add(rolePermission.permission.name);
      }
    }

    return Array.from(permissionSet);
  }

  /**
   * Obtiene usuarios de un tenant con paginación server-side
   * Ejecuta COUNT y SELECT en paralelo para mejor rendimiento
   * SEGURIDAD: Filtrado obligatorio por tenantId
   */
  async findPaginatedUsers(
    params: FindPaginatedUsersParams
  ): Promise<PaginatedUsersResult> {
    const { tenantId, skip, take, sorting, filters } = params;

    // Whitelist de columnas permitidas para sorting (previene SQL injection)
    const allowedSortColumns = ["email", "name", "createdAt"];

    // Construir where clause base
    const baseWhere: Prisma.UserRoleWhereInput = {
      tenantId, // Filtrado OBLIGATORIO por tenant
    };

    // Agregar filtro de búsqueda si existe
    const userWhere: Prisma.UserWhereInput | undefined = filters?.search
      ? {
          OR: [
            { email: { contains: filters.search, mode: "insensitive" } },
            { name: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : undefined;

    // Ejecutar COUNT y SELECT en paralelo
    const [totalUserRoles, userRoles] = await Promise.all([
      // COUNT: Total de usuarios únicos en el tenant
      prisma.userRole.findMany({
        where: {
          ...baseWhere,
          user: userWhere,
        },
        select: { userId: true },
        distinct: ["userId"],
      }),
      // SELECT: Datos paginados
      prisma.userRole.findMany({
        where: {
          ...baseWhere,
          user: userWhere,
        },
        include: {
          user: true,
          role: true,
        },
        orderBy: this.buildUserSorting(sorting, allowedSortColumns),
      }),
    ]);

    // Agrupar por usuario (ya que un usuario puede tener múltiples roles)
    const userMap = new Map<string, UserWithRoles>();

    for (const userRole of userRoles) {
      const userId = userRole.userId;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          id: userRole.user.id,
          email: userRole.user.email,
          name: userRole.user.name,
          image: userRole.user.image,
          roles: [],
          createdAt: userRole.user.createdAt,
        });
      }
      userMap.get(userId)!.roles.push({
        id: userRole.role.id,
        name: userRole.role.name,
      });
    }

    // Convertir a array y aplicar paginación manual (necesario por el groupBy)
    let usersArray = Array.from(userMap.values());

    // Aplicar sorting en memoria si es necesario
    if (sorting && sorting.length > 0) {
      const sortField = sorting[0].id;
      const sortDesc = sorting[0].desc;

      if (allowedSortColumns.includes(sortField)) {
        usersArray.sort((a, b) => {
          let aVal: string | Date | null | undefined;
          let bVal: string | Date | null | undefined;

          if (sortField === "email") {
            aVal = a.email;
            bVal = b.email;
          } else if (sortField === "name") {
            aVal = a.name;
            bVal = b.name;
          } else if (sortField === "createdAt") {
            aVal = a.createdAt;
            bVal = b.createdAt;
          }

          if (aVal === null || aVal === undefined) return sortDesc ? -1 : 1;
          if (bVal === null || bVal === undefined) return sortDesc ? 1 : -1;
          if (aVal < bVal) return sortDesc ? 1 : -1;
          if (aVal > bVal) return sortDesc ? -1 : 1;
          return 0;
        });
      }
    }

    // Aplicar paginación manual
    const paginatedUsers = usersArray.slice(skip, skip + take);

    return {
      data: paginatedUsers,
      totalCount: totalUserRoles.length,
    };
  }

  /**
   * Construye el orderBy para las queries de usuarios
   */
  private buildUserSorting(
    sorting: FindPaginatedUsersParams["sorting"],
    allowedColumns: string[]
  ): Prisma.UserRoleOrderByWithRelationInput[] | undefined {
    if (!sorting || sorting.length === 0) {
      return [{ user: { createdAt: "desc" } }];
    }

    const validSorting = sorting.filter((s) => allowedColumns.includes(s.id));
    if (validSorting.length === 0) {
      return [{ user: { createdAt: "desc" } }];
    }

    return validSorting.map((s) => ({
      user: { [s.id]: s.desc ? "desc" : "asc" },
    }));
  }
}

// Singleton instance
export const prismaUserRoleRepository = new PrismaUserRoleRepository();
