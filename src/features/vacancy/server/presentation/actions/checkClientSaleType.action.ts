"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import type { VacancySaleType } from "@features/vacancy/frontend/types/vacancy.types";
import { CheckAnyPermissonUseCase } from "@features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";

export async function checkClientSaleTypeAction(
  clientId: string
): Promise<{ saleType: VacancySaleType }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { saleType: "NUEVA" };

    const tenantId = await getActiveTenantId();
    if (!tenantId) return { saleType: "NUEVA" };

    const hasPermission = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.vacantes.acceder,
        PermissionActions.vacantes.gestionar,
        PermissionActions.vacantes.crear,
        PermissionActions.vacantes.editar,
      ],
      tenantId,
    });
    if (!hasPermission) return { saleType: "NUEVA" };

    const count = await prismaVacancyRepository.countByClientId(clientId, tenantId);

    return { saleType: count > 0 ? "RECOMPRA" : "NUEVA" };
  } catch {
    return { saleType: "NUEVA" };
  }
}
