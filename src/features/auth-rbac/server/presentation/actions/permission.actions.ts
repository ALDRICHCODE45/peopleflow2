"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";

// Use Cases
import { GetUserPermissionsUseCase } from "../../application/use-cases/GetUserPermissionsUseCase";

// Repositories
import { prismaUserRoleRepository } from "../../infrastructure/repositories/PrismaUserRoleRepository";

// Helpers
import { getDefaultRoute } from "@/core/lib/permissions/get-default-route";
import { getRequiredPermission } from "@/core/shared/helpers/route-permissions.config";
import { hasPermission } from "@/core/shared/helpers/permission-checker";

// Types
import type { GetUserPermissionsResult } from "../../../frontend/types";

/**
 * Server Actions para verificar permisos
 * Capa de presentación - entry points para el frontend
 */

/**
 * Verifica si el usuario actual tiene un permiso específico
 */
export async function checkPermissionAction(
  permission: string,
  tenantId: string | null
): Promise<boolean> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return false;
    }

    // Obtener permisos del usuario inyectando el repositorio
    const useCase = new GetUserPermissionsUseCase(prismaUserRoleRepository);
    const result = await useCase.execute({
      userId: session.user.id,
      tenantId,
    });

    if (!result.success) {
      return false;
    }

    // Verificar si tiene super:admin (acceso total)
    if (result.permissions.includes("super:admin")) {
      return true;
    }

    // Verificar permiso específico
    if (result.permissions.includes(permission)) {
      return true;
    }

    // Verificar permiso modular (:gestionar incluye todas las acciones)
    const parts = permission.split(":");
    if (parts.length === 2) {
      const modularPermission = `${parts[0]}:gestionar`;
      if (result.permissions.includes(modularPermission)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

/**
 * Obtiene todos los permisos del usuario actual en un tenant
 */
export async function getUserPermissionsAction(
  tenantId: string | null
): Promise<GetUserPermissionsResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", permissions: [] };
    }

    // Inyectar el repositorio al caso de uso
    const useCase = new GetUserPermissionsUseCase(prismaUserRoleRepository);
    const result = await useCase.execute({
      userId: session.user.id,
      tenantId,
    });

    if (!result.success) {
      return {
        error: result.error || "Error al obtener permisos",
        permissions: [],
      };
    }

    return { error: null, permissions: result.permissions };
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return { error: "Error al obtener permisos", permissions: [] };
  }
}

/**
 * Obtiene la ruta por defecto para un tenant específico
 * Útil después de cambiar de tenant para redirigir a una ruta válida
 */
export async function getDefaultRouteForTenantAction(
  tenantId: string
): Promise<{ route: string; error: string | null }> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { route: "/sign-in", error: "No autenticado" };
    }

    // Obtener permisos del usuario en el tenant especificado
    const useCase = new GetUserPermissionsUseCase(prismaUserRoleRepository);
    const result = await useCase.execute({
      userId: session.user.id,
      tenantId,
    });

    if (!result.success || result.permissions.length === 0) {
      return { route: "/access-denied", error: result.error || null };
    }

    // Calcular la ruta por defecto basada en los permisos
    const defaultRoute = getDefaultRoute(result.permissions);

    return { route: defaultRoute, error: null };
  } catch (error) {
    console.error("Error getting default route for tenant:", error);
    return { route: "/access-denied", error: "Error al obtener ruta" };
  }
}

/**
 * Verifica si el usuario tiene acceso a una ruta específica en el tenant activo
 * Útil para validar acceso antes de mostrar una página
 */
export async function canAccessRouteAction(
  pathname: string,
  tenantId: string | null
): Promise<{ canAccess: boolean; error: string | null }> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { canAccess: false, error: "No autenticado" };
    }

    // Obtener permisos del usuario en el tenant
    const useCase = new GetUserPermissionsUseCase(prismaUserRoleRepository);
    const result = await useCase.execute({
      userId: session.user.id,
      tenantId,
    });

    if (!result.success) {
      return { canAccess: false, error: result.error || null };
    }

    // Super admin tiene acceso a todo
    if (result.permissions.includes("super:admin")) {
      return { canAccess: true, error: null };
    }

    // Obtener el permiso requerido para la ruta
    const requiredPermission = getRequiredPermission(pathname);

    // Si no hay permiso requerido, permitir acceso
    if (!requiredPermission) {
      return { canAccess: true, error: null };
    }

    // Verificar si tiene el permiso
    const canAccess = hasPermission(result.permissions, requiredPermission);

    return { canAccess, error: null };
  } catch (error) {
    console.error("Error checking route access:", error);
    return { canAccess: false, error: "Error al verificar acceso" };
  }
}
