"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyCommitmentRepository } from "../../infrastructure/repositories/PrismaVacancyCommitmentRepository";
import { CompleteCommitmentUseCase } from "../../application/use-cases/CompleteCommitmentUseCase";
import { Routes } from "@core/shared/constants/routes";
import { ServerErrors } from "@core/shared/constants/error-messages";
import type { CompleteCommitmentResult } from "../../../frontend/types/vacancy.types";

interface CompleteCommitmentInput {
  commitmentId: string;
  note?: string | null;
}

export async function completeCommitmentAction(
  input: CompleteCommitmentInput
): Promise<CompleteCommitmentResult> {
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
        PermissionActions.vacantesCompromisos.completar,
        PermissionActions.vacantesCompromisos.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para completar compromisos" };
    }

    // Execute use case
    const result = await new CompleteCommitmentUseCase(
      prismaVacancyCommitmentRepository
    ).execute({
      commitmentId: input.commitmentId,
      tenantId,
      userId: session.user.id,
      note: input.note,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al completar el compromiso" };
    }

    revalidatePath(Routes.reclutamiento.vacantes);
    return { error: null, commitment: result.commitment };
  } catch (error) {
    console.error("Error in completeCommitmentAction:", error);
    return { error: "Error inesperado" };
  }
}
