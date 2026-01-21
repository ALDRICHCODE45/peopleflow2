"use server";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Repository
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";

// Use Cases
import { CreateVacancyUseCase } from "../../application/use-cases/CreateVacancyUseCase";

// Types
import type { VacancyStatus } from "../../../frontend/types/vacancy.types";
import type { CreateVacancyResult } from "../../../frontend/types/vacancy.types";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";

/**
 * Crea una nueva vacante
 */
export async function createVacancyAction(data: {
  title: string;
  description: string;
  status?: VacancyStatus;
  department?: string;
  location?: string;
}): Promise<CreateVacancyResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado" };
    }

    const tenantId = await getActiveTenantId();

    if (!tenantId) {
      return { error: "No hay tenant activo" };
    }

    //verificar los permisos necesarios para ejecutar la accion
    const hasAnyPermissionUseCase = new CheckAnyPermissonUseCase();

    const hasAnyPermission = await hasAnyPermissionUseCase.execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.vacantes.crear,
        PermissionActions.vacantes.gestionar,
      ],
      tenantId,
    });

    if (!hasAnyPermission) {
      return {
        error: "Error al obtener vacantes",
      };
    }

    const useCase = new CreateVacancyUseCase(prismaVacancyRepository);
    const result = await useCase.execute({
      ...data,
      tenantId,
    });

    if (!result.success) {
      return { error: result.error || "Error al crear vacante" };
    }

    revalidatePath("/reclutamiento/vacantes");
    return {
      error: null,
      vacancy: result.vacancy?.toJSON(),
    };
  } catch (error) {
    console.error("Error creating vacancy:", error);
    return { error: "Error al crear vacante" };
  }
}
