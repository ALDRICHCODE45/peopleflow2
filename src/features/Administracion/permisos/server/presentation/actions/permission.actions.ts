"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Repositorios
import { prismaUserRoleRepository } from "@/features/auth-rbac/server/infrastructure/repositories/PrismaUserRoleRepository";

// Use Cases
import {
  GetAllPermissionsUseCase,
  GetRolePermissionsUseCase,
  AssignPermissionsToRoleUseCase,
} from "../../application/use-cases";

// Tenant actions
import { getCurrentTenantAction } from "@/features/tenants/server/presentation/actions/tenant.actions";

// Types
export interface PermissionItem {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
}

export interface PermissionsByModule {
  [resource: string]: PermissionItem[];
}

export interface GetAllPermissionsResult {
  error: string | null;
  permissions: PermissionsByModule;
}

export interface GetRolePermissionsResult {
  error: string | null;
  permissionIds: string[];
}

export interface AssignPermissionsResult {
  error: string | null;
  success: boolean;
}

/**
 * Obtiene todos los permisos agrupados por módulo
 */
export async function getAllPermissionsAction(): Promise<GetAllPermissionsResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", permissions: {} };
    }

    const useCase = new GetAllPermissionsUseCase();
    const result = await useCase.execute();

    if (!result.success) {
      return { error: result.error || "Error al obtener permisos", permissions: {} };
    }

    return { error: null, permissions: result.permissions };
  } catch (error) {
    console.error("Error in getAllPermissionsAction:", error);
    return { error: "Error al obtener permisos", permissions: {} };
  }
}

/**
 * Obtiene los permisos asignados a un rol
 */
export async function getRolePermissionsAction(
  roleId: string
): Promise<GetRolePermissionsResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", permissionIds: [] };
    }

    const useCase = new GetRolePermissionsUseCase();
    const result = await useCase.execute({ roleId });

    if (!result.success) {
      return { error: result.error || "Error al obtener permisos del rol", permissionIds: [] };
    }

    return { error: null, permissionIds: result.permissionIds };
  } catch (error) {
    console.error("Error in getRolePermissionsAction:", error);
    return { error: "Error al obtener permisos del rol", permissionIds: [] };
  }
}

/**
 * Asigna permisos a un rol
 */
export async function assignPermissionsToRoleAction(
  roleId: string,
  permissionIds: string[]
): Promise<AssignPermissionsResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", success: false };
    }

    // Obtener tenant activo (puede ser null para superadmin)
    const tenantResult = await getCurrentTenantAction();
    const tenantId = tenantResult.tenant?.id || null;

    // Verificar permisos
    const isSuperAdmin = await prismaUserRoleRepository.isSuperAdmin(session.user.id);

    if (!isSuperAdmin && tenantId) {
      const permissions = await prismaUserRoleRepository.getUserPermissions(
        session.user.id,
        tenantId
      );

      const canAssign = permissions.includes("roles:asignar-permisos") ||
                        permissions.includes("roles:gestionar");

      if (!canAssign) {
        return { error: "No tienes permisos para asignar permisos a roles", success: false };
      }
    } else if (!isSuperAdmin) {
      return { error: "No tienes permisos para asignar permisos a roles", success: false };
    }

    const useCase = new AssignPermissionsToRoleUseCase();
    const result = await useCase.execute({
      userId: session.user.id,
      tenantId,
      roleId,
      permissionIds,
    });

    if (!result.success) {
      return { error: result.error || "Error al asignar permisos", success: false };
    }

    revalidatePath("/admin/roles-permisos");
    return { error: null, success: true };
  } catch (error) {
    console.error("Error in assignPermissionsToRoleAction:", error);
    return { error: "Error al asignar permisos", success: false };
  }
}
