"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Repositorios
import { prismaUserRoleRepository } from "@/features/auth-rbac/server/infrastructure/repositories/PrismaUserRoleRepository";

// Tenant actions
import { getCurrentTenantAction } from "@/features/tenants/server/presentation/actions/tenant.actions";

// Use Cases
import {
  GetRolesWithStatsUseCase,
  CreateRoleUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase,
} from "../../application/use-cases";

// Types
export interface RoleWithStats {
  id: string;
  name: string;
  permissionsCount: number;
  usersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetRolesWithStatsResult {
  error: string | null;
  roles: RoleWithStats[];
}

export interface CreateRoleResult {
  error: string | null;
  role?: { id: string; name: string; createdAt: Date; updatedAt: Date };
}

export interface UpdateRoleResult {
  error: string | null;
  role?: { id: string; name: string; createdAt: Date; updatedAt: Date };
}

export interface DeleteRoleResult {
  error: string | null;
  success: boolean;
}

/**
 * Obtiene roles con estadísticas filtrados por el tenant activo
 */
export async function getRolesWithStatsAction(): Promise<GetRolesWithStatsResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", roles: [] };
    }

    // Obtener tenant activo
    const tenantResult = await getCurrentTenantAction();
    if (tenantResult.error || !tenantResult.tenant) {
      return { error: "No hay tenant activo", roles: [] };
    }

    const useCase = new GetRolesWithStatsUseCase(prismaUserRoleRepository);
    const result = await useCase.execute({
      requestingUserId: session.user.id,
      tenantId: tenantResult.tenant.id,
    });

    if (!result.success) {
      return { error: result.error || "Error al obtener roles", roles: [] };
    }

    return { error: null, roles: result.roles || [] };
  } catch (error) {
    console.error("Error in getRolesWithStatsAction:", error);
    return { error: "Error al obtener roles", roles: [] };
  }
}

/**
 * Crea un nuevo rol (solo SuperAdmin)
 * El rol se crea asociado al tenant activo
 */
export async function createRoleAction(name: string): Promise<CreateRoleResult> {
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

    const useCase = new CreateRoleUseCase(prismaUserRoleRepository);
    const result = await useCase.execute({
      requestingUserId: session.user.id,
      name,
      tenantId: tenantResult.tenant.id,
    });

    if (!result.success) {
      return { error: result.error || "Error al crear rol" };
    }

    revalidatePath("/admin/roles-permisos");
    return { error: null, role: result.role };
  } catch (error) {
    console.error("Error in createRoleAction:", error);
    return { error: "Error al crear rol" };
  }
}

/**
 * Actualiza un rol existente (solo SuperAdmin)
 */
export async function updateRoleAction(
  roleId: string,
  name: string
): Promise<UpdateRoleResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado" };
    }

    const useCase = new UpdateRoleUseCase(prismaUserRoleRepository);
    const result = await useCase.execute({
      requestingUserId: session.user.id,
      roleId,
      name,
    });

    if (!result.success) {
      return { error: result.error || "Error al actualizar rol" };
    }

    revalidatePath("/admin/roles-permisos");
    return { error: null, role: result.role };
  } catch (error) {
    console.error("Error in updateRoleAction:", error);
    return { error: "Error al actualizar rol" };
  }
}

/**
 * Elimina un rol (solo SuperAdmin)
 * Solo puede eliminar roles del tenant activo o roles globales
 */
export async function deleteRoleAction(roleId: string): Promise<DeleteRoleResult> {
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

    const useCase = new DeleteRoleUseCase(prismaUserRoleRepository);
    const result = await useCase.execute({
      requestingUserId: session.user.id,
      roleId,
      tenantId: tenantResult.tenant.id,
    });

    if (!result.success) {
      return { error: result.error || "Error al eliminar rol", success: false };
    }

    revalidatePath("/admin/roles-permisos");
    return { error: null, success: true };
  } catch (error) {
    console.error("Error in deleteRoleAction:", error);
    return { error: "Error al eliminar rol", success: false };
  }
}
