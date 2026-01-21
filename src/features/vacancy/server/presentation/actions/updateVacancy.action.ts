"use server";
import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Repository
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";

// Use Cases
import { UpdateVacancyUseCase } from "../../application/use-cases/UpdateVacancyUseCase";

// Types
import type { VacancyStatus } from "../../../frontend/types/vacancy.types";
import type { UpdateVacancyResult } from "../../../frontend/types/vacancy.types";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";

/**
 * Actualiza una vacante existente
 */
export async function updateVacancyAction(
  id: string,
  data: {
    title?: string;
    description?: string;
    status?: VacancyStatus;
    department?: string | null;
    location?: string | null;
  },
): Promise<UpdateVacancyResult> {
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
        PermissionActions.vacantes.editar,
        PermissionActions.vacantes.gestionar,
      ],
      tenantId,
    });

    if (!hasAnyPermission) {
      return {
        error: "Error al obtener vacantes",
      };
    }

    const useCase = new UpdateVacancyUseCase(prismaVacancyRepository);
    const result = await useCase.execute({
      id,
      tenantId,
      ...data,
    });

    if (!result.success) {
      return { error: result.error || "Error al actualizar vacante" };
    }

    revalidatePath("/reclutamiento/vacantes");
    return {
      error: null,
      vacancy: result.vacancy?.toJSON(),
    };
  } catch (error) {
    console.error("Error updating vacancy:", error);
    return { error: "Error al actualizar vacante" };
  }
}
