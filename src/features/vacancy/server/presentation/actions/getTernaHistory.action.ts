"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyTernaHistoryRepository } from "../../infrastructure/repositories/PrismaVacancyTernaHistoryRepository";
import { GetTernaHistoryUseCase } from "../../application/use-cases/GetTernaHistoryUseCase";
import type { TernaHistoryDTO } from "../../application/use-cases/GetTernaHistoryUseCase";

export interface GetTernaHistoryResult {
  error: string | null;
  histories?: TernaHistoryDTO[];
}

export async function getTernaHistoryAction(
  vacancyId: string
): Promise<GetTernaHistoryResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) return { error: "No autenticado" };

    const tenantId = await getActiveTenantId();
    if (!tenantId) return { error: "No hay tenant activo" };

    const hasPermission = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.vacantes.gestionar,
        PermissionActions.vacantes.acceder,
      ],
      tenantId,
    });
    if (!hasPermission) return { error: "Sin permisos" };

    const useCase = new GetTernaHistoryUseCase(prismaVacancyTernaHistoryRepository);
    const result = await useCase.execute({ vacancyId, tenantId });

    if (!result.success) return { error: result.error ?? "Error" };
    return { error: null, histories: result.histories ?? [] };
  } catch (error) {
    console.error("Error in getTernaHistoryAction:", error);
    return { error: "Error inesperado" };
  }
}
