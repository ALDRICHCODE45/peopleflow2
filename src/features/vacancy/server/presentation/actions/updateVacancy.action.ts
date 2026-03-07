"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { UpdateVacancyUseCase } from "../../application/use-cases/UpdateVacancyUseCase";
import { Routes } from "@core/shared/constants/routes";
import type {
  UpdateVacancyFormData,
  UpdateVacancyResult,
} from "../../../frontend/types/vacancy.types";
import { ServerErrors } from "@core/shared/constants/error-messages";

export async function updateVacancyAction(
  id: string,
  data: UpdateVacancyFormData,
): Promise<UpdateVacancyResult> {
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
        PermissionActions.vacantes.editar,
        PermissionActions.vacantes.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para editar vacantes" };
    }

    const useCase = new UpdateVacancyUseCase(prismaVacancyRepository);
    const result = await useCase.execute({
      id,
      tenantId,
      position: data.position,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      salaryFixed: data.salaryFixed,
      commissions: data.commissions,
      benefits: data.benefits,
      tools: data.tools,
      modality: data.modality,
      schedule: data.schedule,
      countryCode: data.countryCode,
      regionCode: data.regionCode,
      requiresPsychometry: data.requiresPsychometry,
      targetDeliveryDate: data.targetDeliveryDate
        ? new Date(data.targetDeliveryDate)
        : data.targetDeliveryDate === null
          ? null
          : undefined,
      entryDate: data.entryDate
        ? new Date(data.entryDate)
        : data.entryDate === null
          ? null
          : undefined,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al actualizar la vacante" };
    }

    revalidatePath(Routes.reclutamiento.vacantes);
    return { error: null, vacancy: result.vacancy?.toJSON() };
  } catch (error) {
    console.error("Error in updateVacancyAction:", error);
    return { error: "Error inesperado al actualizar la vacante" };
  }
}
