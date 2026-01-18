import prisma from "@lib/prisma";
import { IUserRoleRepository } from "@/features/auth-rbac/server/domain/interfaces/IUserRoleRepository";
import { HIDDEN_ADMIN_ROLE_NAME } from "@/core/shared/constants/permissions";

/**
 * Caso de uso: Obtener roles con estadísticas filtrados por tenant
 *
 * Muestra roles del tenant activo y roles globales (tenantId = null).
 * El conteo de usuarios refleja solo usuarios de ese tenant.
 *
 * NOTA: No hay bypass de superadmin - todos deben pertenecer al tenant.
 * SuperAdmin usa rutas /super-admin para administración global.
 */

export interface GetRolesWithStatsInput {
  requestingUserId: string;
  tenantId: string;
}

export interface RoleWithStats {
  id: string;
  name: string;
  permissionsCount: number;
  usersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetRolesWithStatsOutput {
  success: boolean;
  error?: string;
  roles?: RoleWithStats[];
}

export class GetRolesWithStatsUseCase {
  constructor(private readonly userRoleRepository: IUserRoleRepository) {}

  async execute(input: GetRolesWithStatsInput): Promise<GetRolesWithStatsOutput> {
    try {
      // 1. Verificar autorización: SuperAdmin puede acceder a cualquier tenant
      // O el usuario pertenece al tenant
      const isSuperAdmin = await this.userRoleRepository.isSuperAdmin(
        input.requestingUserId
      );

      if (!isSuperAdmin) {
        const belongsToTenant = await this.userRoleRepository.userBelongsToTenant(
          input.requestingUserId,
          input.tenantId
        );

        if (!belongsToTenant) {
          return {
            success: false,
            error: "No tienes acceso a este tenant",
          };
        }
      }

      // IMPORTANTE: Siempre filtrar datos por el tenantId activo
      // SuperAdmin ve solo roles del tenant activo, no de todos
      // SEGURIDAD: Excluir rol de administrador (super:admin) de la lista visible

      // 2. Obtener roles del tenant activo (excluyendo rol de superadmin)
      const roles = await prisma.role.findMany({
        where: {
          AND: [
            {
              OR: [
                { tenantId: input.tenantId }, // Roles del tenant
                { tenantId: null },           // Roles globales
              ],
            },
            {
              name: { not: HIDDEN_ADMIN_ROLE_NAME }, // Excluir rol de superadmin
            },
          ],
        },
        include: {
          _count: {
            select: {
              permissions: true,
            },
          },
          users: {
            where: {
              tenantId: input.tenantId,
            },
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      // 3. Mapear resultados con conteo correcto de usuarios del tenant
      const rolesWithStats: RoleWithStats[] = roles.map((role) => ({
        id: role.id,
        name: role.name,
        permissionsCount: role._count.permissions,
        usersCount: role.users.length,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      }));

      return {
        success: true,
        roles: rolesWithStats,
      };
    } catch (error) {
      console.error("Error in GetRolesWithStatsUseCase:", error);
      return {
        success: false,
        error: "Error al obtener los roles",
      };
    }
  }
}
