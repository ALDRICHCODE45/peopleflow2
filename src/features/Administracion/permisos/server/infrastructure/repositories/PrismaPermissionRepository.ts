import prisma from "@lib/prisma";
import { Permission } from "@/features/auth-rbac/server/domain/entities/Permission";
import { IPermissionRepository } from "@/features/auth-rbac/server/domain/interfaces/IPermissionRepository";

/**
 * Implementación del repositorio de Permissions usando Prisma
 * Capa de infraestructura - acceso a datos
 */
export class PrismaPermissionRepository implements IPermissionRepository {
  async findById(id: string): Promise<Permission | null> {
    const permission = await prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) return null;

    return new Permission({
      id: permission.id,
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    });
  }

  async findByName(name: string): Promise<Permission | null> {
    const permission = await prisma.permission.findUnique({
      where: { name },
    });

    if (!permission) return null;

    return new Permission({
      id: permission.id,
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    });
  }

  async findByRoleId(roleId: string): Promise<Permission[]> {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    });

    return rolePermissions.map(
      (rp) =>
        new Permission({
          id: rp.permission.id,
          name: rp.permission.name,
          resource: rp.permission.resource,
          action: rp.permission.action,
          description: rp.permission.description,
          createdAt: rp.permission.createdAt,
          updatedAt: rp.permission.updatedAt,
        })
    );
  }

  async findAll(): Promise<Permission[]> {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });

    return permissions.map(
      (p) =>
        new Permission({
          id: p.id,
          name: p.name,
          resource: p.resource,
          action: p.action,
          description: p.description,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })
    );
  }

  async findByResource(resource: string): Promise<Permission[]> {
    const permissions = await prisma.permission.findMany({
      where: { resource },
      orderBy: { action: "asc" },
    });

    return permissions.map(
      (p) =>
        new Permission({
          id: p.id,
          name: p.name,
          resource: p.resource,
          action: p.action,
          description: p.description,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })
    );
  }

  /**
   * Asigna permisos a un rol (reemplaza los existentes)
   */
  async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[]
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Eliminar permisos existentes del rol
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // Crear nuevas asignaciones
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }
    });
  }

  /**
   * Obtiene los IDs de permisos asignados a un rol
   */
  async getPermissionIdsByRoleId(roleId: string): Promise<string[]> {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true },
    });

    return rolePermissions.map((rp) => rp.permissionId);
  }
}

// Singleton instance
export const prismaPermissionRepository = new PrismaPermissionRepository();
