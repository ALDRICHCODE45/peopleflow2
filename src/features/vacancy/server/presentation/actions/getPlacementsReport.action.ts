"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { GetPlacementsReportUseCase } from "../../application/use-cases/GetPlacementsReportUseCase";
import { prismaVacancyStatusHistoryRepository } from "../../infrastructure/repositories/PrismaVacancyStatusHistoryRepository";
import { ServerErrors } from "@core/shared/constants/error-messages";
import type { PlacementsReportDTO } from "@features/vacancy/frontend/types/vacancy.types";

export interface GetPlacementsReportInput {
  from: string;
  to: string;
}

export interface GetPlacementsReportResult {
  error: string | null;
  data?: PlacementsReportDTO;
}

export async function getPlacementsReportAction(
  input: GetPlacementsReportInput
): Promise<GetPlacementsReportResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: ServerErrors.notAuthenticated };

    const tenantId = await getActiveTenantId();
    if (!tenantId) return { error: ServerErrors.noActiveTenant };

    const hasPermission = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.reportesReclutamiento.acceder,
        PermissionActions.reportesReclutamiento.gestionar,
      ],
      tenantId,
    });
    if (!hasPermission) return { error: "Sin permisos" };

    const result = await new GetPlacementsReportUseCase(
      prismaVacancyStatusHistoryRepository
    ).execute({ tenantId, from: input.from, to: input.to });

    if (!result.success) return { error: result.error ?? "Error inesperado" };
    return { error: null, data: result.data };
  } catch (error) {
    console.error("Error in getPlacementsReportAction:", error);
    return { error: "Error inesperado" };
  }
}
