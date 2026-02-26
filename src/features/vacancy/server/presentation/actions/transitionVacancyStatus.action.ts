"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import prisma from "@lib/prisma";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { prismaVacancyStatusHistoryRepository } from "../../infrastructure/repositories/PrismaVacancyStatusHistoryRepository";
import { TransitionVacancyStatusUseCase } from "../../application/use-cases/TransitionVacancyStatusUseCase";
import type {
  VacancyStatusType,
  TransitionVacancyStatusResult,
} from "../../../frontend/types/vacancy.types";

export interface TransitionVacancyStatusInput {
  vacancyId: string;
  newStatus: VacancyStatusType;
  reason?: string;
  newTargetDeliveryDate?: string;
}

export async function transitionVacancyStatusAction(
  input: TransitionVacancyStatusInput,
): Promise<TransitionVacancyStatusResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado" };
    }

    const tenantId = await getActiveTenantId();
    if (!tenantId) {
      return { error: "No hay tenant activo" };
    }

    const hasPermission = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.vacantes.gestionar,
        PermissionActions.vacantes.autorizarRetroceso,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para cambiar el estado de la vacante" };
    }

    // Query attachment counts needed for state machine guards
    // Only relevant for QUICK_MEETING → HUNTING transition, but we query always
    // to keep the action generic (cheap query, correct behavior)
    const [jobDescCount, perfilMuestraValidatedCount] = await Promise.all([
      prisma.attachment.count({
        where: {
          vacancyId: input.vacancyId,
          subType: "JOB_DESCRIPTION",
        },
      }),
      prisma.attachment.count({
        where: {
          vacancyId: input.vacancyId,
          subType: "PERFIL_MUESTRA",
          isValidated: true,
        },
      }),
    ]);

    const useCase = new TransitionVacancyStatusUseCase(
      prismaVacancyRepository,
      prismaVacancyStatusHistoryRepository,
    );

    const result = await useCase.execute({
      vacancyId: input.vacancyId,
      tenantId,
      newStatus: input.newStatus,
      changedById: session.user.id,
      reason: input.reason ?? null,
      newTargetDeliveryDate: input.newTargetDeliveryDate
        ? new Date(input.newTargetDeliveryDate)
        : null,
      hasJobDescription: jobDescCount > 0,
      hasValidatedPerfilMuestra: perfilMuestraValidatedCount > 0,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al cambiar el estado" };
    }

    revalidatePath("/reclutamiento/vacantes");
    return { error: null, vacancy: result.vacancy };
  } catch (error) {
    console.error("Error in transitionVacancyStatusAction:", error);
    return { error: "Error inesperado al cambiar el estado de la vacante" };
  }
}
