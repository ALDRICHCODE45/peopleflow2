"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { prismaVacancyCandidateRepository } from "../../infrastructure/repositories/PrismaVacancyCandidateRepository";
import { Routes } from "@core/shared/constants/routes";
import { prismaVacancyStatusHistoryRepository } from "../../infrastructure/repositories/PrismaVacancyStatusHistoryRepository";
import { prismaVacancyChecklistRepository } from "../../infrastructure/repositories/PrismaVacancyChecklistRepository";
import { prismaVacancyCandidateMatchRepository } from "../../infrastructure/repositories/PrismaVacancyCandidateMatchRepository";
import { ValidateTernaUseCase } from "../../application/use-cases/ValidateTernaUseCase";
import { prismaVacancyTernaHistoryRepository } from "../../infrastructure/repositories/PrismaVacancyTernaHistoryRepository";
import type { ValidateTernaResult } from "../../../frontend/types/vacancy.types";
import { ServerErrors } from "@core/shared/constants/error-messages";

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
      return { error: ServerErrors.notAuthenticated };
    }

    const tenantId = await getActiveTenantId();
    if (!tenantId) {
      return { error: ServerErrors.noActiveTenant };
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

    // Guard: if vacancy has checklist items, all terna candidates must have rated all items
    const checklistItems = await prismaVacancyChecklistRepository.findByVacancyId(
      input.vacancyId,
      tenantId,
    );

    if (checklistItems.length > 0) {
      const checklistItemIds = checklistItems.map((i) => i.id);
      for (const candidateId of input.candidateIds) {
        const ratedCount = await prismaVacancyCandidateMatchRepository.countRatedForCandidate(
          candidateId,
          checklistItemIds,
          tenantId,
        );
        if (ratedCount < checklistItems.length) {
          return {
            error:
              "Todos los candidatos de la terna deben tener el checklist evaluado antes de validar.",
          };
        }
      }
    }

    const useCase = new ValidateTernaUseCase(
      prismaVacancyRepository,
      prismaVacancyCandidateRepository,
      prismaVacancyStatusHistoryRepository,
      prismaVacancyTernaHistoryRepository,
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

    revalidatePath(Routes.reclutamiento.vacantes);
    return { error: null, vacancy: result.vacancy };
  } catch (error) {
    console.error("Error in validateTernaAction:", error);
    return { error: "Error inesperado al validar la terna" };
  }
}
