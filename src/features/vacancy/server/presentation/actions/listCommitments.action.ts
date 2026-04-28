"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyCommitmentRepository } from "../../infrastructure/repositories/PrismaVacancyCommitmentRepository";
import { ListCommitmentsUseCase } from "../../application/use-cases/ListCommitmentsUseCase";
import { ServerErrors } from "@core/shared/constants/error-messages";
import type { ListCommitmentsResult } from "../../../frontend/types/vacancy.types";

interface ListCommitmentsInput {
  vacancyId: string;
}

export async function listCommitmentsAction(
  input: ListCommitmentsInput
): Promise<ListCommitmentsResult> {
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
        PermissionActions.vacantesCompromisos.acceder,
        PermissionActions.vacantesCompromisos.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para acceder a compromisos" };
    }

    // Execute use case
    const result = await new ListCommitmentsUseCase(
      prismaVacancyCommitmentRepository
    ).execute({
      vacancyId: input.vacancyId,
      tenantId,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al listar compromisos" };
    }

    return { error: null, commitments: result.commitments };
  } catch (error) {
    console.error("Error in listCommitmentsAction:", error);
    return { error: "Error inesperado" };
  }
}
