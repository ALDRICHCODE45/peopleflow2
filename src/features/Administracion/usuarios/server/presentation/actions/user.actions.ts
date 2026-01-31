"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import prisma from "@lib/prisma";
import { HIDDEN_ADMIN_ROLE_NAME } from "@/core/shared/constants/permissions";

// Repositorios
import { prismaUserRoleRepository } from "@/features/auth-rbac/server/infrastructure/repositories/PrismaUserRoleRepository";
import { prismaRoleRepository } from "@/features/auth-rbac/server/infrastructure/repositories/PrismaRoleRepository";

// Use Cases
import {
  GetTenantUsersUseCase,
  CreateUserUseCase,
  AssignUserToTenantUseCase,
  UpdateUserUseCase,
  DeleteUserFromTenantUseCase,
  UpdateUserRolesUseCase,
  InviteUserToTenantUseCase,
} from "../../application/use-cases";

// Tenant repository
import { prismaTenantRepository } from "@/features/tenants/server/infrastructure/repositories/PrismaTenantRepository";

// Tenant actions
import { getCurrentTenantAction } from "@/features/tenants/server/presentation/actions/tenant.actions";
import { SendNotificationUseCase } from "@/features/Notifications/server/application/use-cases/SendNotificationUseCase";
import { prismaNotificationRepository } from "@/features/Notifications/server/infrastructure/repositories/PrismaNotificationRepository";
import { emailProvider } from "@/features/Notifications/server/infrastructure/providers/EmailProvider";

// Types
export interface TenantUser {
  id: string;
  email: string;
  name: string | null;
  roles: Array<{ id: string; name: string }>;
  createdAt?: Date;
}

export interface GetTenantUsersResult {
  error: string | null;
  users: TenantUser[];
}

export interface CreateUserResult {
  error: string | null;
  user?: { id: string; email: string; name: string | null };
}

export interface UpdateUserResult {
  error: string | null;
  user?: { id: string; email: string; name: string | null };
}

export interface DeleteUserResult {
  error: string | null;
  success: boolean;
}

export interface UpdateUserRolesResult {
  error: string | null;
  success: boolean;
  roles?: Array<{ id: string; name: string }>;
}

export interface GetRolesResult {
  error: string | null;
  roles: Array<{ id: string; name: string }>;
}

export interface InvitableTenant {
  id: string;
  name: string;
  slug: string;
}

export interface GetInvitableTenantsResult {
  error: string | null;
  tenants: InvitableTenant[];
}

export interface InviteToTenantResult {
  error: string | null;
  success: boolean;
}

/**
 * Obtiene los usuarios del tenant activo
 */
export async function getTenantUsersAction(): Promise<GetTenantUsersResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", users: [] };
    }

    // Obtener tenant activo
    const tenantResult = await getCurrentTenantAction();
    if (tenantResult.error || !tenantResult.tenant) {
      return { error: "No hay tenant activo", users: [] };
    }

    const useCase = new GetTenantUsersUseCase(prismaUserRoleRepository);
    const result = await useCase.execute({
      tenantId: tenantResult.tenant.id,
      requestingUserId: session.user.id,
    });

    if (!result.success) {
      return { error: result.error || "Error al obtener usuarios", users: [] };
    }

    return { error: null, users: result.users };
  } catch (error) {
    console.error("Error in getTenantUsersAction:", error);
    return { error: "Error al obtener usuarios", users: [] };
  }
}

/**
 * Crea un nuevo usuario y opcionalmente lo asigna al tenant actual
 * SEGURIDAD: Valida que el creador tenga todos los permisos del rol a asignar
 */
export async function createUserAction(data: {
  email: string;
  password: string;
  name: string;
  roleId?: string;
}): Promise<CreateUserResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado" };
    }

    // Verificar permisos
    const isSuperAdmin = await prismaUserRoleRepository.isSuperAdmin(
      session.user.id,
    );
    const tenantResult = await getCurrentTenantAction();

    // Obtener permisos del usuario creador (si no es SuperAdmin)
    let creatorPermissions: string[] = [];

    if (!isSuperAdmin) {
      if (tenantResult.error || !tenantResult.tenant) {
        return { error: "No hay tenant activo" };
      }

      // Verificar permiso de crear usuarios
      creatorPermissions = await prismaUserRoleRepository.getUserPermissions(
        session.user.id,
        tenantResult.tenant.id,
      );

      const canCreate =
        creatorPermissions.includes("usuarios:crear") ||
        creatorPermissions.includes("usuarios:gestionar");

      if (!canCreate) {
        return { error: "No tienes permisos para crear usuarios" };
      }
    }

    // Crear usuario con Better Auth
    const createUserUseCase = new CreateUserUseCase();
    const createResult = await createUserUseCase.execute({
      email: data.email,
      password: data.password,
      name: data.name,
    });

    if (!createResult.success || !createResult.user) {
      return { error: createResult.error || "Error al crear usuario" };
    }

    // Si hay roleId, asignar al tenant actual
    if (data.roleId && tenantResult.tenant) {
      // Verificar que el rol existe, pertenece al tenant y no es admin
      const role = await prisma.role.findFirst({
        where: {
          id: data.roleId,
          OR: [{ tenantId: tenantResult.tenant.id }, { tenantId: null }],
          name: { not: HIDDEN_ADMIN_ROLE_NAME },
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!role) {
        return { error: "Rol no válido para este tenant" };
      }

      // SEGURIDAD: Si no es SuperAdmin, validar que el creador tiene
      // todos los permisos del rol que está asignando (previene privilege escalation)
      if (!isSuperAdmin) {
        const rolePermissions = role.permissions.map(
          (rp) => rp.permission.name,
        );

        const unauthorizedPermissions = rolePermissions.filter(
          (perm) => !creatorPermissions.includes(perm),
        );

        if (unauthorizedPermissions.length > 0) {
          return {
            error: `No puedes asignar un rol con permisos que no posees: ${unauthorizedPermissions.join(", ")}`,
          };
        }
      }

      // Crear asignación directamente
      await prisma.userRole.create({
        data: {
          userId: createResult.user.id,
          roleId: data.roleId,
          tenantId: tenantResult.tenant.id,
        },
      });
    }

    revalidatePath("/admin/usuarios");
    return { error: null, user: createResult.user };
  } catch (error) {
    console.error("Error in createUserAction:", error);
    return { error: "Error al crear usuario" };
  }
}

/**
 * Actualiza un usuario existente
 */
export async function updateUserAction(
  userId: string,
  data: { name?: string; email?: string },
): Promise<UpdateUserResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado" };
    }

    // Obtener tenant activo
    const tenantResult = await getCurrentTenantAction();
    if (tenantResult.error || !tenantResult.tenant) {
      return { error: "No hay tenant activo" };
    }

    const useCase = new UpdateUserUseCase(prismaUserRoleRepository);
    const result = await useCase.execute({
      userId,
      tenantId: tenantResult.tenant.id,
      requestingUserId: session.user.id,
      name: data.name,
      email: data.email,
    });

    if (!result.success) {
      return { error: result.error || "Error al actualizar usuario" };
    }

    revalidatePath("/admin/usuarios");
    return { error: null, user: result.user };
  } catch (error) {
    console.error("Error in updateUserAction:", error);
    return { error: "Error al actualizar usuario" };
  }
}

/**
 * Elimina un usuario del tenant (elimina el UserRole, no el usuario)
 */
export async function deleteUserFromTenantAction(
  userId: string,
): Promise<DeleteUserResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", success: false };
    }

    // Obtener tenant activo
    const tenantResult = await getCurrentTenantAction();
    if (tenantResult.error || !tenantResult.tenant) {
      return { error: "No hay tenant activo", success: false };
    }

    const useCase = new DeleteUserFromTenantUseCase(prismaUserRoleRepository);
    const result = await useCase.execute({
      userId,
      tenantId: tenantResult.tenant.id,
      requestingUserId: session.user.id,
    });

    if (!result.success) {
      return {
        error: result.error || "Error al eliminar usuario",
        success: false,
      };
    }

    revalidatePath("/admin/usuarios");
    return { error: null, success: true };
  } catch (error) {
    console.error("Error in deleteUserFromTenantAction:", error);
    return { error: "Error al eliminar usuario", success: false };
  }
}

/**
 * Actualiza los roles de un usuario en el tenant actual
 */
export async function updateUserRolesAction(
  userId: string,
  roleIds: string[],
): Promise<UpdateUserRolesResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", success: false };
    }

    // Obtener tenant activo
    const tenantResult = await getCurrentTenantAction();
    if (tenantResult.error || !tenantResult.tenant) {
      return { error: "No hay tenant activo", success: false };
    }

    const useCase = new UpdateUserRolesUseCase(
      prismaUserRoleRepository,
      prismaRoleRepository,
    );
    const result = await useCase.execute({
      userId,
      tenantId: tenantResult.tenant.id,
      requestingUserId: session.user.id,
      roleIds,
    });

    if (!result.success) {
      return {
        error: result.error || "Error al actualizar roles",
        success: false,
      };
    }

    revalidatePath("/admin/usuarios");
    return {
      error: null,
      success: true,
      roles: result.assignedRoles?.map((r) => ({
        id: r.roleId,
        name: r.roleName,
      })),
    };
  } catch (error) {
    console.error("Error in updateUserRolesAction:", error);
    return { error: "Error al actualizar roles", success: false };
  }
}

/**
 * Obtiene los roles disponibles para asignar
 * SEGURIDAD: Valida que el usuario tenga acceso al tenant solicitado
 */
export async function getAvailableRolesAction(
  tenantId: string,
): Promise<GetRolesResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", roles: [] };
    }

    // SEGURIDAD: Verificar que el usuario tenga acceso al tenant solicitado
    const isSuperAdmin = await prismaUserRoleRepository.isSuperAdmin(
      session.user.id,
    );

    if (!isSuperAdmin) {
      // Usuario normal: verificar que pertenece al tenant
      const belongsToTenant =
        await prismaUserRoleRepository.userBelongsToTenant(
          session.user.id,
          tenantId,
        );

      if (!belongsToTenant) {
        return {
          error: "No tienes acceso a este tenant",
          roles: [],
        };
      }
    }

    // Solo después de validar acceso, obtener roles
    const roles = await prismaRoleRepository.findByTenantId(tenantId);

    // SEGURIDAD: Filtrar el rol de administrador
    const filteredRoles = roles.filter(
      (role) => role.name !== HIDDEN_ADMIN_ROLE_NAME,
    );

    return {
      error: null,
      roles: filteredRoles.map((role) => ({ id: role.id, name: role.name })),
    };
  } catch (error) {
    console.error("Error in getAvailableRolesAction:", error);
    return { error: "Error al obtener roles", roles: [] };
  }
}

/**
 * Obtiene los tenants a los que el usuario puede invitar
 * SEGURIDAD:
 * - SuperAdmin: Retorna todos los tenants del sistema
 * - Usuario normal: Retorna solo tenants donde tiene permiso de invitar
 */
export async function getInvitableTenantsAction(): Promise<GetInvitableTenantsResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", tenants: [] };
    }

    const isSuperAdmin = await prismaUserRoleRepository.isSuperAdmin(
      session.user.id,
    );

    if (isSuperAdmin) {
      // SuperAdmin: retorna todos los tenants
      const allTenants = await prismaTenantRepository.findAll();
      return {
        error: null,
        tenants: allTenants.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
        })),
      };
    }

    // Usuario normal: filtrar por permisos
    const userTenants = await prismaTenantRepository.findByUserId(
      session.user.id,
    );
    const tenantsWithPermission: InvitableTenant[] = [];

    for (const tenant of userTenants) {
      const permissions = await prismaUserRoleRepository.getUserPermissions(
        session.user.id,
        tenant.id,
      );

      const canInvite =
        permissions.includes("usuarios:invitar-tenant") ||
        permissions.includes("usuarios:gestionar");

      if (canInvite) {
        tenantsWithPermission.push({
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        });
      }
    }

    return {
      error: null,
      tenants: tenantsWithPermission,
    };
  } catch (error) {
    console.error("Error in getInvitableTenantsAction:", error);
    return { error: "Error al obtener tenants", tenants: [] };
  }
}

/**
 * Invita un usuario existente a un tenant
 * SEGURIDAD:
 * - Verifica que no sea auto-invitacion
 * - SuperAdmin: puede invitar a cualquier tenant
 * - Usuario normal: debe tener permiso en el tenant destino
 */
export async function inviteUserToTenantAction(data: {
  userId: string;
  tenantId: string;
  roleIds: string[];
}): Promise<InviteToTenantResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", success: false };
    }

    // SEGURIDAD: Prevenir auto-invitacion
    if (data.userId === session.user.id) {
      return { error: "No puedes invitarte a ti mismo", success: false };
    }

    // Validar que se selecciono al menos un rol
    if (!data.roleIds || data.roleIds.length === 0) {
      return { error: "Debes seleccionar al menos un rol", success: false };
    }

    const isSuperAdmin = await prismaUserRoleRepository.isSuperAdmin(
      session.user.id,
    );

    // SEGURIDAD: Si no es SuperAdmin, verificar permiso en tenant destino
    if (!isSuperAdmin) {
      const permissionsInTargetTenant =
        await prismaUserRoleRepository.getUserPermissions(
          session.user.id,
          data.tenantId,
        );

      const canInvite =
        permissionsInTargetTenant.includes("usuarios:invitar-tenant") ||
        permissionsInTargetTenant.includes("usuarios:gestionar");

      if (!canInvite) {
        return {
          error: "No tienes permisos para invitar en este tenant",
          success: false,
        };
      }
    }

    //

    const notificationUseCase = new SendNotificationUseCase(
      prismaNotificationRepository,
      [emailProvider],
    );

    // Ejecutar caso de uso
    const useCase = new InviteUserToTenantUseCase(
      prismaUserRoleRepository,
      prismaTenantRepository,
      prismaRoleRepository,
      notificationUseCase,
    );

    const result = await useCase.execute({
      userId: data.userId,
      tenantId: data.tenantId,
      roleIds: data.roleIds,
      invitedById: session.user.id,
      invitedByName: session.user.name || session.user.email || "Un usuario",
    });

    if (!result.success) {
      return {
        error: result.error || "Error al invitar usuario",
        success: false,
      };
    }

    revalidatePath("/admin/usuarios");
    return { error: null, success: true };
  } catch (error) {
    console.error("Error in inviteUserToTenantAction:", error);
    return { error: "Error al invitar usuario", success: false };
  }
}
