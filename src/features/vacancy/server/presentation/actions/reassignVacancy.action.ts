"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { prismaRecruiterAssignmentHistoryRepository } from "../../infrastructure/repositories/PrismaRecruiterAssignmentHistoryRepository";
import { ReassignVacancyUseCase } from "../../application/use-cases/ReassignVacancyUseCase";
import { Routes } from "@core/shared/constants/routes";
import type {
  ReassignVacancyInput,
  ReassignVacancyResult,
} from "../../../frontend/types/vacancy.types";
import { ServerErrors } from "@core/shared/constants/error-messages";

export async function reassignVacancyAction(
  input: ReassignVacancyInput,
): Promise<ReassignVacancyResult> {
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
        PermissionActions.vacantes.reasignar,
        PermissionActions.vacantes.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para reasignar vacantes" };
    }

    // Fetch current vacancy data for status, targetDeliveryDate, wasOverdue
    const vacancy = await prismaVacancyRepository.findById(
      input.vacancyId,
      tenantId,
    );

    if (!vacancy) {
      return { error: "Vacante no encontrada" };
    }

    // Fetch new recruiter name
    const recruiterContact =
      await prismaVacancyRepository.findRecruiterContactById(
        input.newRecruiterId,
      );

    if (!recruiterContact) {
      return { error: "Reclutador no encontrado" };
    }

    // Determine if vacancy is overdue
    const wasOverdue =
      vacancy.targetDeliveryDate !== null &&
      new Date() > vacancy.targetDeliveryDate;

    const useCase = new ReassignVacancyUseCase(
      prismaRecruiterAssignmentHistoryRepository,
    );

    const result = await useCase.execute({
      vacancyId: input.vacancyId,
      tenantId,
      newRecruiterId: input.newRecruiterId,
      newRecruiterName: recruiterContact.name ?? "Reclutador",
      reason: input.reason,
      notes: input.notes ?? null,
      currentVacancyStatus: vacancy.status,
      targetDeliveryDate: vacancy.targetDeliveryDate,
      wasOverdue,
      assignedById: session.user.id,
      assignedByName: session.user.name ?? "Sistema",
    });

    if (!result.success) {
      return { error: result.error ?? "Error al reasignar la vacante" };
    }

    revalidatePath(Routes.reclutamiento.vacantes);
    revalidatePath(`${Routes.reclutamiento.vacantes}/${input.vacancyId}`);
    return { error: null };
  } catch (error) {
    console.error("Error in reassignVacancyAction:", error);
    return { error: "Error inesperado al reasignar la vacante" };
  }
}
