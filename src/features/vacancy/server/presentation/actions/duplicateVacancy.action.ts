"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { ServerErrors } from "@core/shared/constants/error-messages";
import { Routes } from "@core/shared/constants/routes";
import { auth } from "@lib/auth";

import { DuplicateVacancyUseCase } from "../../application/use-cases/DuplicateVacancyUseCase";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import type { DuplicateVacancyResult } from "../../../frontend/types/vacancy.types";

export async function duplicateVacancyAction(vacancyId: string): Promise<DuplicateVacancyResult> {
  try {
    if (!vacancyId) {
      return { error: "Debes seleccionar una vacante" };
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { error: ServerErrors.notAuthenticated };
    }

    const tenantId = await getActiveTenantId();
    if (!tenantId) {
      return { error: ServerErrors.noActiveTenant };
    }

    const hasPermission = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.vacantes.crear,
        PermissionActions.vacantes.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para duplicar vacantes" };
    }

    const useCase = new DuplicateVacancyUseCase(prismaVacancyRepository);
    const result = await useCase.execute({
      vacancyId,
      tenantId,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al duplicar la vacante" };
    }

    revalidatePath(Routes.reclutamiento.vacantes);

    return {
      error: null,
      data: result.data,
    };
  } catch (error) {
    console.error("Error in duplicateVacancyAction:", error);
    return { error: "Error inesperado al duplicar la vacante" };
  }
}
