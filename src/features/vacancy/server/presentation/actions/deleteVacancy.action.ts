"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Repository
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";

// Use Cases
import { DeleteVacancyUseCase } from "../../application/use-cases/DeleteVacancyUseCase";

// Types
import type { DeleteVacancyResult } from "../../../frontend/types/vacancy.types";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";

/**
 * Elimina una vacante
 */
export async function deleteVacancyAction(
  id: string,
): Promise<DeleteVacancyResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", success: false };
    }

    const tenantId = await getActiveTenantId();

    if (!tenantId) {
      return { error: "No hay tenant activo", success: false };
    }

    //verificar los permisos necesarios para ejecutar la accion
    const hasAnyPermissionUseCase = new CheckAnyPermissonUseCase();

    const hasAnyPermission = await hasAnyPermissionUseCase.execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.vacantes.eliminar,
        PermissionActions.vacantes.gestionar,
      ],
      tenantId,
    });

    if (!hasAnyPermission) {
      return {
        error: null,
        success: true,
      };
    }

    const useCase = new DeleteVacancyUseCase(prismaVacancyRepository);
    const result = await useCase.execute({ id, tenantId });

    if (!result.success) {
      return {
        error: result.error || "Error al eliminar vacante",
        success: false,
      };
    }

    revalidatePath("/reclutamiento/vacantes");
    return { error: null, success: true };
  } catch (error) {
    console.error("Error deleting vacancy:", error);
    return { error: "Error al eliminar vacante", success: false };
  }
}
