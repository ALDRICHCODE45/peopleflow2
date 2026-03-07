"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import type { GetVacanciesResult } from "@/features/vacancy/frontend/types/vacancy.types";
import { ServerErrors } from "@core/shared/constants/error-messages";

export async function getVacanciesAction(): Promise<GetVacanciesResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: ServerErrors.notAuthenticated, vacancies: [] };
    }

    const tenantId = await getActiveTenantId();
    if (!tenantId) {
      return { error: ServerErrors.noActiveTenant, vacancies: [] };
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
      return { error: "Sin permisos para acceder a vacantes", vacancies: [] };
    }

    const vacancies = await prismaVacancyRepository.findByTenantId(tenantId);
    return { error: null, vacancies: vacancies.map((v) => v.toJSON()) };
  } catch (error) {
    console.error("Error in getVacanciesAction:", error);
    return { error: "Error inesperado al obtener vacantes", vacancies: [] };
  }
}
