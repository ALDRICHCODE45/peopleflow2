"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { GetVacancyDetailUseCase } from "../../application/use-cases/GetVacancyDetailUseCase";
import type { GetVacancyDetailResult } from "../../../frontend/types/vacancy.types";
import { ServerErrors } from "@core/shared/constants/error-messages";

export async function getVacancyDetailAction(
  vacancyId: string,
): Promise<GetVacancyDetailResult> {
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
        PermissionActions.vacantes.acceder,
        PermissionActions.vacantes.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para acceder a vacantes" };
    }

    const useCase = new GetVacancyDetailUseCase(prismaVacancyRepository);
    const result = await useCase.execute({ id: vacancyId, tenantId });

    if (!result.success) {
      return { error: result.error ?? "Error al obtener la vacante" };
    }

    return { error: null, vacancy: result.vacancy };
  } catch (error) {
    console.error("Error in getVacancyDetailAction:", error);
    return { error: "Error inesperado al obtener la vacante" };
  }
}
