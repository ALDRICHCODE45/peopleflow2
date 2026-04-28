"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyCommitmentRepository } from "../../infrastructure/repositories/PrismaVacancyCommitmentRepository";
import { UpdateCommitmentUseCase } from "../../application/use-cases/UpdateCommitmentUseCase";
import { Routes } from "@core/shared/constants/routes";
import { ServerErrors } from "@core/shared/constants/error-messages";
import type { VacancyCommitmentDTO } from "../../../frontend/types/vacancy.types";

interface UpdateCommitmentInput {
  commitmentId: string;
  description?: string;
  dueDate?: string;
}

export interface UpdateCommitmentResult {
  error: string | null;
  commitment?: VacancyCommitmentDTO;
}

export async function updateCommitmentAction(
  input: UpdateCommitmentInput
): Promise<UpdateCommitmentResult> {
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
        PermissionActions.vacantesCompromisos.editar,
        PermissionActions.vacantesCompromisos.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para editar compromisos" };
    }

    // Execute use case
    const result = await new UpdateCommitmentUseCase(
      prismaVacancyCommitmentRepository
    ).execute({
      commitmentId: input.commitmentId,
      tenantId,
      userId: session.user.id,
      description: input.description,
      dueDate: input.dueDate,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al actualizar el compromiso" };
    }

    revalidatePath(Routes.reclutamiento.vacantes);
    return { error: null, commitment: result.commitment };
  } catch (error) {
    console.error("Error in updateCommitmentAction:", error);
    return { error: "Error inesperado" };
  }
}
