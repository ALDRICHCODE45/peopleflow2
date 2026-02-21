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
          avatar: userRole.user.avatar,
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
  ): Promise<{ name: string; id: string; image: string | null; avatar: string | null; email: string } | null> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) return null;

    return {
      name: user.name ?? "",
      image: user.image,
      avatar: user.avatar,
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
   *
   * OPTIMIZACIÓN: Una sola query obtiene roles globales (tenantId=null) Y del tenant,
   * luego determina SuperAdmin y extrae permisos en memoria.
   */
  async getUserPermissions(
    userId: string,
    tenantId: string | null
  ): Promise<string[]> {
    // FAIL-CLOSED: Sin tenant, sin permisos (para usuarios normales)
    // Pero aún necesitamos verificar SuperAdmin con roles globales
    const whereConditions: Prisma.UserRoleWhereInput[] = [
      { tenantId: null }, // Roles globales (SuperAdmin)
    ];

    if (tenantId) {
      whereConditions.push({ tenantId }); // Roles del tenant específico
    }

    // UNA SOLA QUERY: Obtiene roles globales + del tenant con solo nombres de permisos
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        OR: whereConditions,
      },
      select: {
        tenantId: true,
        role: {
          select: {
            permissions: {
              select: {
                permission: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    // Determinar si es SuperAdmin: tiene algún rol global con permiso super:admin
    const globalRoles = userRoles.filter((ur) => ur.tenantId === null);
    const isSuperAdmin = globalRoles.some((ur) =>
      ur.role.permissions.some(
        (rp) => rp.permission.name === SUPER_ADMIN_PERMISSION_NAME
      )
    );

    if (isSuperAdmin) {
      // SuperAdmin: Extraer permisos de roles globales
      return this.extractPermissionNames(globalRoles);
    }

    // Usuario normal: FAIL-CLOSED sin tenant
    if (!tenantId) {
      return [];
    }

    // Usuario normal: Extraer SOLO permisos del tenant específico
    const tenantRoles = userRoles.filter((ur) => ur.tenantId === tenantId);
    return this.extractPermissionNames(tenantRoles);
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
    return this.extractPermissionNames(userRoles);
  }

  /**
   * Extrae nombres de permisos únicos de roles con select optimizado
   */
  private extractPermissionNames(
    roles: Array<{
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

    for (const userRole of roles) {
      for (const rolePermission of userRole.role.permissions) {
        permissionSet.add(rolePermission.permission.name);
      }
    }

    return Array.from(permissionSet);
  }

  /**
   * Obtiene usuarios de un tenant con paginación server-side
   * OPTIMIZACIÓN: Paginación a nivel de BD en vez de en memoria
   * 1. Obtener IDs de usuarios paginados con distinct + skip/take
   * 2. Obtener count total de usuarios distintos
   * 3. Cargar roles solo para los usuarios de la página actual
   * SEGURIDAD: Filtrado obligatorio por tenantId
   */
  async findPaginatedUsers(
    params: FindPaginatedUsersParams
  ): Promise<PaginatedUsersResult> {
    const { tenantId, skip, take, sorting, filters } = params;

    // Whitelist de columnas permitidas para sorting (previene SQL injection)
    const allowedSortColumns = ["email", "name", "createdAt"];

    // Construir where clause para User
    const userWhere: Prisma.UserWhereInput = {
      userRoles: { some: { tenantId } }, // Usuario pertenece al tenant
      ...(filters?.search
        ? {
            OR: [
              { email: { contains: filters.search, mode: "insensitive" as const } },
              { name: { contains: filters.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    // Construir orderBy para User
    const orderBy = this.buildUserDirectSorting(sorting, allowedSortColumns);

    // Ejecutar COUNT y paginated SELECT en paralelo a nivel de User
    const [totalCount, paginatedUsers] = await Promise.all([
      prisma.user.count({ where: userWhere }),
      prisma.user.findMany({
        where: userWhere,
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          avatar: true,
          createdAt: true,
          userRoles: {
            where: { tenantId },
            select: {
              role: { select: { id: true, name: true } },
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
    ]);

    const data: UserWithRoles[] = paginatedUsers.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      avatar: user.avatar,
      createdAt: user.createdAt,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
      })),
    }));

    return { data, totalCount };
  }

  /**
   * Construye el orderBy directo para User model
   */
  private buildUserDirectSorting(
    sorting: FindPaginatedUsersParams["sorting"],
    allowedColumns: string[]
  ): Prisma.UserOrderByWithRelationInput[] {
    if (!sorting || sorting.length === 0) {
      return [{ createdAt: "desc" }];
    }

    const validSorting = sorting.filter((s) => allowedColumns.includes(s.id));
    if (validSorting.length === 0) {
      return [{ createdAt: "desc" }];
    }

    return validSorting.map((s) => ({
      [s.id]: s.desc ? "desc" : "asc",
    }));
  }
}

// Singleton instance
export const prismaUserRoleRepository = new PrismaUserRoleRepository();
