"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@lib/auth";
import { ServerErrors } from "@core/shared/constants/error-messages";
import { PermissionActions } from "@core/shared/constants/permissions";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";

import { DeleteClientUseCase } from "../../application/use-cases/DeleteClientUseCase";
import { prismaClientRepository } from "../../infrastructure/repositories/PrismaClientRepository";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import type { DeleteClientActionResult } from "../../../frontend/types/client.types";

/**
 * Elimina un cliente existente
 */
export async function deleteClientAction(
  clientId: string,
): Promise<DeleteClientActionResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: ServerErrors.notAuthenticated, success: false };
    }

    const tenantId = await getActiveTenantId();

    if (!tenantId) {
      return { error: ServerErrors.noActiveTenant, success: false };
    }

    // Verificar permisos
    const permissionCheck = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.clientes.eliminar,
        PermissionActions.clientes.gestionar,
      ],
      tenantId,
    });

    if (!permissionCheck.hasAnyPermission) {
      return { error: "No tienes permisos para eliminar clientes", success: false };
    }

    // Ejecutar caso de uso
    const useCase = new DeleteClientUseCase(prismaClientRepository);
    const result = await useCase.execute({
      id: clientId,
      tenantId,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al eliminar el cliente", success: false };
    }

    revalidatePath("/finanzas/clientes");

    return {
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("Error in deleteClientAction:", error);
    return { error: "Error inesperado al eliminar el cliente", success: false };
  }
}
