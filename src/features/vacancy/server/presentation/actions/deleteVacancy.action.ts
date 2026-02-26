"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { DeleteVacancyUseCase } from "../../application/use-cases/DeleteVacancyUseCase";
import type { DeleteVacancyResult } from "../../../frontend/types/vacancy.types";

export async function deleteVacancyAction(id: string): Promise<DeleteVacancyResult> {
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

    const hasPermission = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.vacantes.eliminar,
        PermissionActions.vacantes.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para eliminar vacantes", success: false };
    }

    const useCase = new DeleteVacancyUseCase(prismaVacancyRepository);
    const result = await useCase.execute({ id, tenantId });

    if (!result.success) {
      return { error: result.error ?? "Error al eliminar la vacante", success: false };
    }

    revalidatePath("/reclutamiento/vacantes");
    return { error: null, success: true };
  } catch (error) {
    console.error("Error in deleteVacancyAction:", error);
    return { error: "Error inesperado al eliminar la vacante", success: false };
  }
}
