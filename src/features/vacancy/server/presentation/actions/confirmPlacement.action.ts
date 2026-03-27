"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { prismaVacancyStatusHistoryRepository } from "../../infrastructure/repositories/PrismaVacancyStatusHistoryRepository";
import { Routes } from "@core/shared/constants/routes";
import { ConfirmPlacementUseCase } from "../../application/use-cases/ConfirmPlacementUseCase";
import type { ConfirmPlacementResult } from "../../../frontend/types/vacancy.types";
import { ServerErrors } from "@core/shared/constants/error-messages";

export async function confirmPlacementAction(
  vacancyId: string,
  hiredCandidateId?: string
): Promise<ConfirmPlacementResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: ServerErrors.notAuthenticated };
    }

    const tenantId = await getActiveTenantId();
    if (!tenantId) {
      return { error: ServerErrors.noActiveTenant };
    }

    const hasPermission = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [PermissionActions.vacantes.gestionar],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para confirmar el placement" };
    }

    const useCase = new ConfirmPlacementUseCase(
      prismaVacancyRepository,
      prismaVacancyStatusHistoryRepository,
    );

    const result = await useCase.execute({
      vacancyId,
      tenantId,
      changedById: session.user.id,
      hiredCandidateId,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al confirmar el placement" };
    }

    revalidatePath(Routes.reclutamiento.vacantes);
    return { error: null, vacancy: result.vacancy };
  } catch (error) {
    console.error("Error in confirmPlacementAction:", error);
    return { error: "Error inesperado al confirmar el placement" };
  }
}
