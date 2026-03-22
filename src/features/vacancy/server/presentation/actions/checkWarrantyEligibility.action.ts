"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { CheckWarrantyEligibilityUseCase } from "../../application/use-cases/CheckWarrantyEligibilityUseCase";
import type { CheckWarrantyEligibilityResult } from "../../../frontend/types/vacancy.types";
import { ServerErrors } from "@core/shared/constants/error-messages";

export async function checkWarrantyEligibilityAction(
  vacancyId: string,
): Promise<CheckWarrantyEligibilityResult> {
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

    const useCase = new CheckWarrantyEligibilityUseCase(
      prismaVacancyRepository,
    );
    const result = await useCase.execute({ vacancyId, tenantId });

    if (!result.success) {
      return { error: result.error ?? "Error al verificar elegibilidad" };
    }

    return { error: null, eligibility: result.eligibility };
  } catch (error) {
    console.error("Error in checkWarrantyEligibilityAction:", error);
    return { error: "Error inesperado al verificar elegibilidad de garantía" };
  }
}
