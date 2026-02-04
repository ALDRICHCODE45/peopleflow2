"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Repositories
import { prismaTenantRepository } from "../../infrastructure/repositories/PrismaTenantRepository";
import { prismaUserRoleRepository } from "@/features/auth-rbac/server/infrastructure/repositories/PrismaUserRoleRepository";
import { getDefaultRoute } from "@/core/lib/permissions/get-default-route";

// Use Cases
import { GetUserTenantsUseCase } from "../../application/use-cases/GetUserTenantsUseCase";
import { CreateTenantUseCase } from "../../application/use-cases/CreateTenantUseCase";
import { SwitchTenantUseCase } from "../../application/use-cases/SwitchTenantUseCase";
import { GetCurrentTenantUseCase } from "../../application/use-cases/GetCurrentTenantUseCase";

// Types
import type {
  GetUserTenantsResult,
  CreateTenantResult,
  SwitchTenantResult,
  GetCurrentTenantResult,
} from "../../../frontend/types";

/**
 * Server Actions para gestionar tenants
 * Capa de presentación - entry points para el frontend
 */

/**
 * Obtiene todos los tenants del usuario autenticado
 */
export async function getUserTenantsAction(): Promise<GetUserTenantsResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", tenants: [] };
    }

    const useCase = new GetUserTenantsUseCase(prismaTenantRepository);
    const result = await useCase.execute({ userId: session.user.id });

    if (!result.success) {
      return { error: result.error || "Error al obtener tenants", tenants: [] };
    }

    return { error: null, tenants: result.tenants };
  } catch (error) {
    console.error("Error getting user tenants:", error);
    return { error: "Error al obtener tenants", tenants: [] };
  }
}

/**
 * Crea un nuevo tenant (solo superadmin)
 */
export async function createTenantAction(formData: FormData): Promise<CreateTenantResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado" };
    }

    // Verificar que sea superadmin
    const isSuperAdmin = await prismaUserRoleRepository.isSuperAdmin(session.user.id);

    if (!isSuperAdmin) {
      return { error: "No tienes permisos para crear tenants" };
    }

    const name = formData.get("name") as string;
    const slug = (formData.get("slug") as string) || undefined;

    if (!name) {
      return { error: "El nombre es requerido" };
    }

    const useCase = new CreateTenantUseCase(prismaTenantRepository);
    const result = await useCase.execute({ name, slug });

    if (!result.success) {
      return { error: result.error || "Error al crear tenant" };
    }

    revalidatePath("/admin");
    return {
      error: null,
      tenant: result.tenant?.toJSON(),
    };
  } catch (error) {
    console.error("Error creating tenant:", error);
    return { error: "Error al crear tenant" };
  }
}

/**
 * Cambia el tenant activo en la sesión actual
 */
export async function switchTenantAction(
  tenantId: string | null
): Promise<SwitchTenantResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.session) {
      return { error: "No autenticado" };
    }

    const useCase = new SwitchTenantUseCase(
      prismaTenantRepository,
      prismaUserRoleRepository
    );
    const result = await useCase.execute({
      sessionToken: session.session.token,
      userId: session.user.id,
      tenantId,
    });

    if (!result.success) {
      return { error: result.error || "Error al cambiar tenant" };
    }

    const userPermissions = await prismaUserRoleRepository.getUserPermissions(
      session.user.id,
      tenantId
    );
    const redirectUrl = getDefaultRoute(userPermissions);

    revalidatePath("/", "layout");
    return { error: null, redirectUrl };
  } catch (error) {
    console.error("Error switching tenant:", error);
    return { error: "Error al cambiar tenant" };
  }
}

/**
 * Obtiene el tenant activo de la sesión actual
 */
export async function getCurrentTenantAction(): Promise<GetCurrentTenantResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.session) {
      return { error: "No autenticado", tenant: null };
    }

    const useCase = new GetCurrentTenantUseCase(prismaTenantRepository);
    const result = await useCase.execute({
      sessionToken: session.session.token,
    });

    if (!result.success) {
      return { error: result.error || "Error al obtener tenant", tenant: null };
    }

    return {
      error: null,
      tenant: result.tenant?.toJSON() || null,
    };
  } catch (error) {
    console.error("Error getting current tenant:", error);
    return { error: "Error al obtener tenant", tenant: null };
  }
}
