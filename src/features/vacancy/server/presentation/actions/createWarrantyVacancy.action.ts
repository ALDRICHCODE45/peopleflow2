"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { CreateWarrantyVacancyUseCase } from "../../application/use-cases/CreateWarrantyVacancyUseCase";

import { Routes } from "@core/shared/constants/routes";
import type {
  CreateWarrantyVacancyInput,
  CreateWarrantyVacancyResult,
} from "../../../frontend/types/vacancy.types";
import { ServerErrors } from "@core/shared/constants/error-messages";

export async function createWarrantyVacancyAction(
  data: CreateWarrantyVacancyInput,
): Promise<CreateWarrantyVacancyResult> {
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
        PermissionActions.vacantes.crear,
        PermissionActions.vacantes.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para crear vacantes de garantía" };
    }

    // Fetch recruiter name for initial assignment record
    const recruiterContact = await prismaVacancyRepository.findRecruiterContactById(data.recruiterId);

    const useCase = new CreateWarrantyVacancyUseCase(prismaVacancyRepository);
    const result = await useCase.execute({
      ...data,
      tenantId,
      userId: session.user.id,
      recruiterName: recruiterContact?.name ?? null,
      createdByName: session.user.name ?? null,
    });

    if (!result.success) {
      return {
        error: result.error ?? "Error al crear la vacante de garantía",
      };
    }

    revalidatePath(Routes.reclutamiento.vacantes);
    return { error: null, vacancy: result.vacancy };
  } catch (error) {
    console.error("Error in createWarrantyVacancyAction:", error);
    return { error: "Error inesperado al crear la vacante de garantía" };
  }
}
