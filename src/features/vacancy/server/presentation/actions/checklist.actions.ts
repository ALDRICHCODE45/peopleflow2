"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { prismaVacancyChecklistRepository } from "../../infrastructure/repositories/PrismaVacancyChecklistRepository";
import { Routes } from "@core/shared/constants/routes";
import { AddChecklistItemUseCase } from "../../application/use-cases/AddChecklistItemUseCase";
import { UpdateChecklistItemUseCase } from "../../application/use-cases/UpdateChecklistItemUseCase";
import { DeleteChecklistItemUseCase } from "../../application/use-cases/DeleteChecklistItemUseCase";
import { ServerErrors } from "@core/shared/constants/error-messages";
import type {
  ChecklistItemResult,
  DeleteChecklistItemResult,
} from "../../../frontend/types/vacancy.types";

/**
 * Agrega un ítem al checklist de una vacante
 */
export async function addChecklistItemAction(
  vacancyId: string,
  requirement: string,
  order?: number,
): Promise<ChecklistItemResult> {
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
      return { error: "Sin permisos para modificar el checklist" };
    }

    const useCase = new AddChecklistItemUseCase(
      prismaVacancyRepository,
      prismaVacancyChecklistRepository,
    );

    const result = await useCase.execute({
      vacancyId,
      tenantId,
      requirement,
      order,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al agregar el ítem" };
    }

    revalidatePath(Routes.reclutamiento.vacantes);
    return { error: null, item: result.item?.toJSON() };
  } catch (error) {
    console.error("Error in addChecklistItemAction:", error);
    return { error: "Error inesperado al agregar el ítem de checklist" };
  }
}

export interface UpdateChecklistItemInput {
  requirement?: string;
  isCompleted?: boolean;
  order?: number;
}

/**
 * Actualiza un ítem del checklist
 */
export async function updateChecklistItemAction(
  itemId: string,
  data: UpdateChecklistItemInput,
): Promise<ChecklistItemResult> {
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
      return { error: "Sin permisos para modificar el checklist" };
    }

    const useCase = new UpdateChecklistItemUseCase(prismaVacancyChecklistRepository);
    const result = await useCase.execute({
      id: itemId,
      tenantId,
      requirement: data.requirement,
      isCompleted: data.isCompleted,
      order: data.order,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al actualizar el ítem" };
    }

    revalidatePath(Routes.reclutamiento.vacantes);
    return { error: null, item: result.item?.toJSON() };
  } catch (error) {
    console.error("Error in updateChecklistItemAction:", error);
    return { error: "Error inesperado al actualizar el ítem de checklist" };
  }
}

/**
 * Elimina un ítem del checklist
 */
export async function deleteChecklistItemAction(
  itemId: string,
): Promise<DeleteChecklistItemResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: ServerErrors.notAuthenticated, success: false };
    }

    const tenantId = await getActiveTenantId();
    if (!tenantId) {
      return { error: ServerErrors.noActiveTenant, success: false };
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
      return { error: "Sin permisos para modificar el checklist", success: false };
    }

    const useCase = new DeleteChecklistItemUseCase(prismaVacancyChecklistRepository);
    const result = await useCase.execute({ id: itemId, tenantId });

    if (!result.success) {
      return { error: result.error ?? "Error al eliminar el ítem", success: false };
    }

    revalidatePath(Routes.reclutamiento.vacantes);
    return { error: null, success: true };
  } catch (error) {
    console.error("Error in deleteChecklistItemAction:", error);
    return { error: "Error inesperado al eliminar el ítem de checklist", success: false };
  }
}
