"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { prismaRecruiterAssignmentHistoryRepository } from "../../infrastructure/repositories/PrismaRecruiterAssignmentHistoryRepository";
import { GetRecruiterAssignmentHistoryUseCase } from "../../application/use-cases/GetRecruiterAssignmentHistoryUseCase";
import type { RecruiterAssignmentHistoryDTO } from "../../../frontend/types/vacancy.types";
import { ServerErrors } from "@core/shared/constants/error-messages";

export interface GetRecruiterAssignmentHistoryResult {
  error: string | null;
  data: RecruiterAssignmentHistoryDTO[];
}

export async function getRecruiterAssignmentHistoryAction(
  vacancyId: string,
): Promise<GetRecruiterAssignmentHistoryResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: ServerErrors.notAuthenticated, data: [] };
    }

    const tenantId = await getActiveTenantId();
    if (!tenantId) {
      return { error: ServerErrors.noActiveTenant, data: [] };
    }

    const useCase = new GetRecruiterAssignmentHistoryUseCase(
      prismaRecruiterAssignmentHistoryRepository,
    );

    const result = await useCase.execute({ vacancyId, tenantId });

    if (!result.success) {
      return {
        error: result.error ?? "Error al obtener el historial",
        data: [],
      };
    }

    return { error: null, data: result.data ?? [] };
  } catch (error) {
    console.error("Error in getRecruiterAssignmentHistoryAction:", error);
    return { error: "Error inesperado al obtener el historial", data: [] };
  }
}
