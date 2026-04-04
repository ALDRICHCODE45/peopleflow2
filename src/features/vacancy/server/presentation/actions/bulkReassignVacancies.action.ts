"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { ServerErrors } from "@core/shared/constants/error-messages";
import { Routes } from "@core/shared/constants/routes";
import { auth } from "@lib/auth";

import { BulkReassignVacanciesUseCase } from "../../application/use-cases/BulkReassignVacanciesUseCase";
import { prismaRecruiterAssignmentHistoryRepository } from "../../infrastructure/repositories/PrismaRecruiterAssignmentHistoryRepository";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import type {
  BulkReassignVacanciesInput,
  BulkReassignVacanciesResult,
} from "../../../frontend/types/vacancy.types";

export async function bulkReassignVacanciesAction(
  input: BulkReassignVacanciesInput,
): Promise<BulkReassignVacanciesResult> {
  try {
    const ids = input.ids.length > 0 ? input.ids : input.vacancyIds;

    if (ids.length === 0) {
      return { error: "Debes seleccionar al menos una vacante" };
    }

    const session = await auth.api.getSession({ headers: await headers() });

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
        PermissionActions.vacantes.reasignar,
        PermissionActions.vacantes.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para reasignar vacantes" };
    }

    const useCase = new BulkReassignVacanciesUseCase(
      prismaRecruiterAssignmentHistoryRepository,
      prismaVacancyRepository,
    );

    const result = await useCase.execute({
      ids,
      tenantId,
      recruiterId: input.recruiterId,
      reason: input.reason,
      notes: input.notes,
      assignedByUserId: session.user.id,
      assignedByName: session.user.name ?? "Sistema",
    });

    if (!result.success) {
      return { error: result.error ?? "Error al reasignar vacantes" };
    }

    revalidatePath(Routes.reclutamiento.vacantes);

    return {
      error: null,
      data: result.data,
    };
  } catch (error) {
    console.error("Error in bulkReassignVacanciesAction:", error);
    return { error: "Error inesperado al reasignar vacantes" };
  }
}
