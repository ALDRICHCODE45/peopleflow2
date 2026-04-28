"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyCommitmentRepository } from "../../infrastructure/repositories/PrismaVacancyCommitmentRepository";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { CreateCommitmentUseCase } from "../../application/use-cases/CreateCommitmentUseCase";
import { Routes } from "@core/shared/constants/routes";
import { ServerErrors } from "@core/shared/constants/error-messages";
import type { CreateCommitmentResult } from "../../../frontend/types/vacancy.types";

interface CreateCommitmentInput {
  vacancyId: string;
  description: string;
  dueDate: string;
}

export async function createCommitmentAction(
  input: CreateCommitmentInput
): Promise<CreateCommitmentResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { error: ServerErrors.notAuthenticated };
    }

    const tenantId = await getActiveTenantId();
    if (!tenantId) {
      return { error: ServerErrors.noActiveTenant };
    }

    // Permission check
    const hasPermission = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.vacantesCompromisos.crear,
        PermissionActions.vacantesCompromisos.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para crear compromisos" };
    }

    // Execute use case
    const result = await new CreateCommitmentUseCase(
      prismaVacancyCommitmentRepository,
      prismaVacancyRepository
    ).execute({
      vacancyId: input.vacancyId,
      tenantId,
      description: input.description,
      dueDate: input.dueDate,
      createdById: session.user.id,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al crear el compromiso" };
    }

    revalidatePath(Routes.reclutamiento.vacantes);
    return { error: null, commitment: result.commitment };
  } catch (error) {
    console.error("Error in createCommitmentAction:", error);
    return { error: "Error inesperado" };
  }
}
