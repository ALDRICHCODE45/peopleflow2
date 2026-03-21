"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyCandidateRepository } from "../../infrastructure/repositories/PrismaVacancyCandidateRepository";
import { prismaVacancyChecklistRepository } from "../../infrastructure/repositories/PrismaVacancyChecklistRepository";
import { prismaVacancyCandidateMatchRepository } from "../../infrastructure/repositories/PrismaVacancyCandidateMatchRepository";
import { SaveCandidateMatchUseCase } from "../../application/use-cases/SaveCandidateMatchUseCase";
import type { SaveMatchResult, CandidateMatchRating } from "../../../frontend/types/vacancy.types";
import { ServerErrors } from "@core/shared/constants/error-messages";

export interface SaveCandidateMatchInput {
  candidateId: string;
  checklistItemId: string;
  rating: CandidateMatchRating | null;
  feedback: string | null;
}

export async function saveCandidateMatchAction(
  input: SaveCandidateMatchInput,
): Promise<SaveMatchResult> {
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
      return { error: "Sin permisos para gestionar candidatos" };
    }

    const useCase = new SaveCandidateMatchUseCase(
      prismaVacancyCandidateRepository,
      prismaVacancyChecklistRepository,
      prismaVacancyCandidateMatchRepository,
    );

    const result = await useCase.execute({
      candidateId: input.candidateId,
      checklistItemId: input.checklistItemId,
      rating: input.rating,
      feedback: input.feedback,
      tenantId,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al guardar el match" };
    }

    return {
      error: null,
      match: result.match
        ? {
            id: result.match.id,
            candidateId: result.match.candidateId,
            checklistItemId: result.match.checklistItemId,
            rating: result.match.rating,
            feedback: result.match.feedback,
            tenantId: result.match.tenantId,
            createdAt: result.match.createdAt.toISOString(),
            updatedAt: result.match.updatedAt.toISOString(),
          }
        : undefined,
    };
  } catch (error) {
    console.error("Error in saveCandidateMatchAction:", error);
    return { error: "Error inesperado al guardar el match del candidato" };
  }
}
