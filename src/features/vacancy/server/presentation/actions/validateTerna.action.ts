"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { prismaVacancyCandidateRepository } from "../../infrastructure/repositories/PrismaVacancyCandidateRepository";
import { prismaVacancyStatusHistoryRepository } from "../../infrastructure/repositories/PrismaVacancyStatusHistoryRepository";
import { ValidateTernaUseCase } from "../../application/use-cases/ValidateTernaUseCase";
import type { ValidateTernaResult } from "../../../frontend/types/vacancy.types";

export interface ValidateTernaInput {
  vacancyId: string;
  candidateIds: string[];
}

export async function validateTernaAction(
  input: ValidateTernaInput,
): Promise<ValidateTernaResult> {
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
        PermissionActions.vacantes.validarTerna,
        PermissionActions.vacantes.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para validar la terna" };
    }

    const useCase = new ValidateTernaUseCase(
      prismaVacancyRepository,
      prismaVacancyCandidateRepository,
      prismaVacancyStatusHistoryRepository,
    );

    const result = await useCase.execute({
      vacancyId: input.vacancyId,
      tenantId,
      candidateIds: input.candidateIds,
      changedById: session.user.id,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al validar la terna" };
    }

    revalidatePath("/reclutamiento/vacantes");
    return { error: null, vacancy: result.vacancy };
  } catch (error) {
    console.error("Error in validateTernaAction:", error);
    return { error: "Error inesperado al validar la terna" };
  }
}
