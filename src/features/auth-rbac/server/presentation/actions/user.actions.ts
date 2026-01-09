"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Repositories
import { prismaRoleRepository } from "../../infrastructure/repositories/PrismaRoleRepository";
import { prismaUserRoleRepository } from "../../infrastructure/repositories/PrismaUserRoleRepository";

// Use Cases
import { CreateUserUseCase } from "../../application/use-cases/CreateUserUseCase";
import { AssignUserToTenantUseCase } from "../../application/use-cases/AssignUserToTenantUseCase";
import { GetTenantUsersUseCase } from "../../application/use-cases/GetTenantUsersUseCase";
import { IsSuperAdminUseCase } from "../../application/use-cases/IsSuperAdminUseCase";

// Types
import type {
  CreateUserResult,
  AssignUserToTenantResult,
  GetTenantUsersResult,
} from "../../../frontend/types";

/**
 * Server Actions para gestionar usuarios
 * Capa de presentación - entry points para el frontend
 */

/**
 * Crea un nuevo usuario (solo superadmin)
 */
export async function createUserAction(formData: FormData): Promise<CreateUserResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado" };
    }

    // Verificar que sea superadmin
    const isSuperAdminUseCase = new IsSuperAdminUseCase(prismaUserRoleRepository);
    const superAdminResult = await isSuperAdminUseCase.execute({
      userId: session.user.id,
    });

    if (!superAdminResult.isSuperAdmin) {
      return { error: "No tienes permisos para crear usuarios" };
    }

    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { error: "Email y contraseña son requeridos" };
    }

    const useCase = new CreateUserUseCase();
    const result = await useCase.execute({ email, password, name });

    if (!result.success) {
      return { error: result.error || "Error al crear usuario" };
    }

    revalidatePath("/admin");
    return {
      error: null,
      user: result.user as CreateUserResult["user"],
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: "Error al crear usuario" };
  }
}

/**
 * Asigna un usuario a un tenant con un rol específico (solo superadmin)
 */
export async function assignUserToTenantAction(
  formData: FormData
): Promise<AssignUserToTenantResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado" };
    }

    // Verificar que sea superadmin
    const isSuperAdminUseCase = new IsSuperAdminUseCase(prismaUserRoleRepository);
    const superAdminResult = await isSuperAdminUseCase.execute({
      userId: session.user.id,
    });

    if (!superAdminResult.isSuperAdmin) {
      return { error: "No tienes permisos para asignar usuarios a tenants" };
    }

    const userId = formData.get("userId") as string;
    const tenantId = formData.get("tenantId") as string;
    const roleName = formData.get("roleName") as string;

    if (!userId || !tenantId || !roleName) {
      return { error: "Usuario, tenant y rol son requeridos" };
    }

    const useCase = new AssignUserToTenantUseCase(
      prismaRoleRepository,
      prismaUserRoleRepository
    );
    const result = await useCase.execute({ userId, tenantId, roleName });

    if (!result.success) {
      return { error: result.error || "Error al asignar usuario a tenant" };
    }

    revalidatePath("/admin");
    return {
      error: null,
      userRole: result.userRole as AssignUserToTenantResult["userRole"],
    };
  } catch (error) {
    console.error("Error assigning user to tenant:", error);
    return { error: "Error al asignar usuario a tenant" };
  }
}

/**
 * Obtiene todos los usuarios de un tenant
 */
export async function getTenantUsersAction(
  tenantId: string
): Promise<GetTenantUsersResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", users: [] };
    }

    const useCase = new GetTenantUsersUseCase(prismaUserRoleRepository);
    const result = await useCase.execute({
      tenantId,
      requestingUserId: session.user.id,
    });

    if (!result.success) {
      return { error: result.error || "Error al obtener usuarios", users: [] };
    }

    return { error: null, users: result.users };
  } catch (error) {
    console.error("Error getting tenant users:", error);
    return { error: "Error al obtener usuarios", users: [] };
  }
}

/**
 * Verifica si el usuario actual es superadmin
 */
export async function isSuperAdminAction(): Promise<boolean> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return false;
    }

    const useCase = new IsSuperAdminUseCase(prismaUserRoleRepository);
    const result = await useCase.execute({ userId: session.user.id });

    return result.isSuperAdmin;
  } catch (error) {
    console.error("Error checking superadmin:", error);
    return false;
  }
}

/**
 * Tipo para el resultado de getRolesAction
 */
export interface GetRolesResult {
  error: string | null;
  roles: Array<{ id: string; name: string }>;
}

/**
 * Obtiene todos los roles disponibles en el sistema
 * Solo accesible para superadmins
 */
export async function getRolesAction(): Promise<GetRolesResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", roles: [] };
    }

    // Verificar que sea superadmin
    const isSuperAdminUseCase = new IsSuperAdminUseCase(prismaUserRoleRepository);
    const superAdminResult = await isSuperAdminUseCase.execute({
      userId: session.user.id,
    });

    if (!superAdminResult.isSuperAdmin) {
      return { error: "No tienes permisos para ver los roles", roles: [] };
    }

    // Obtener roles del repositorio
    const roles = await prismaRoleRepository.findAll();

    return {
      error: null,
      roles: roles.map((role) => ({ id: role.id, name: role.name })),
    };
  } catch (error) {
    console.error("Error getting roles:", error);
    return { error: "Error al obtener roles", roles: [] };
  }
}
