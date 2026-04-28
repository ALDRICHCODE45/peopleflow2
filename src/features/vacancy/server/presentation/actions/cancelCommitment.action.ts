"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyCommitmentRepository } from "../../infrastructure/repositories/PrismaVacancyCommitmentRepository";
import { CancelCommitmentUseCase } from "../../application/use-cases/CancelCommitmentUseCase";
import { Routes } from "@core/shared/constants/routes";
import { ServerErrors } from "@core/shared/constants/error-messages";
import type { CancelCommitmentResult } from "../../../frontend/types/vacancy.types";

interface CancelCommitmentInput {
  commitmentId: string;
  reason?: string | null;
}

export async function cancelCommitmentAction(
  input: CancelCommitmentInput
): Promise<CancelCommitmentResult> {
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
        PermissionActions.vacantesCompromisos.cancelar,
        PermissionActions.vacantesCompromisos.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para cancelar compromisos" };
    }

    // Execute use case
    const result = await new CancelCommitmentUseCase(
      prismaVacancyCommitmentRepository
    ).execute({
      commitmentId: input.commitmentId,
      tenantId,
      userId: session.user.id,
      reason: input.reason,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al cancelar el compromiso" };
    }

    revalidatePath(Routes.reclutamiento.vacantes);
    return { error: null, commitment: result.commitment };
  } catch (error) {
    console.error("Error in cancelCommitmentAction:", error);
    return { error: "Error inesperado" };
  }
}
