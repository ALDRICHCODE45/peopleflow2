"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyConfigRepository } from "../../infrastructure/repositories/PrismaVacancyConfigRepository";
import { GetVacancyConfigUseCase } from "../../application/use-cases/GetVacancyConfigUseCase";
import { UpsertVacancyConfigUseCase } from "../../application/use-cases/UpsertVacancyConfigUseCase";
import type {
  GetVacancyConfigResult,
  UpsertVacancyConfigResult,
  VacancyConfigDTO,
} from "../../../frontend/types/vacancy.types";
import type { VacancyConfigData } from "../../domain/interfaces/IVacancyConfigRepository";
import type { UpsertVacancyConfigInput } from "../../application/use-cases/UpsertVacancyConfigUseCase";
import { ServerErrors } from "@core/shared/constants/error-messages";

/** Convierte VacancyConfigData (con Date) a VacancyConfigDTO (con ISO strings) */
function toConfigDTO(config: VacancyConfigData): VacancyConfigDTO {
  return {
    id: config.id,
    tenantId: config.tenantId,
    quickMeetingSlaHours: config.quickMeetingSlaHours,
    requirePhone: config.requirePhone,
    requireEmail: config.requireEmail,
    requireIsCurrentlyEmployed: config.requireIsCurrentlyEmployed,
    requireCurrentCompany: config.requireCurrentCompany,
    requireCurrentSalary: config.requireCurrentSalary,
    requireSalaryExpectation: config.requireSalaryExpectation,
    requireCurrentModality: config.requireCurrentModality,
    requireCurrentLocation: config.requireCurrentLocation,
    requireCurrentCommissions: config.requireCurrentCommissions,
    requireCurrentBenefits: config.requireCurrentBenefits,
    requireCandidateLocation: config.requireCandidateLocation,
    requireOtherBenefits: config.requireOtherBenefits,
    requireCv: config.requireCv,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  };
}

/**
 * Obtiene la configuración de vacantes del tenant
 */
export async function getVacancyConfigAction(): Promise<GetVacancyConfigResult> {
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
        PermissionActions.super.admin,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para acceder a la configuración" };
    }

    const useCase = new GetVacancyConfigUseCase(prismaVacancyConfigRepository);
    const result = await useCase.execute({ tenantId });

    if (!result.success) {
      return { error: result.error ?? "Error al obtener la configuración" };
    }

    return {
      error: null,
      config: result.config ? toConfigDTO(result.config) : undefined,
    };
  } catch (error) {
    console.error("Error in getVacancyConfigAction:", error);
    return { error: "Error inesperado al obtener la configuración" };
  }
}

export type UpsertVacancyConfigData = Omit<UpsertVacancyConfigInput, "tenantId">;

/**
 * Crea o actualiza la configuración de vacantes del tenant
 */
export async function upsertVacancyConfigAction(
  data: UpsertVacancyConfigData,
): Promise<UpsertVacancyConfigResult> {
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
        PermissionActions.vacantes.gestionar,
        PermissionActions.super.admin,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para configurar vacantes" };
    }

    const useCase = new UpsertVacancyConfigUseCase(prismaVacancyConfigRepository);
    const result = await useCase.execute({ tenantId, ...data });

    if (!result.success) {
      return { error: result.error ?? "Error al guardar la configuración" };
    }

    return {
      error: null,
      config: result.config ? toConfigDTO(result.config) : undefined,
    };
  } catch (error) {
    console.error("Error in upsertVacancyConfigAction:", error);
    return { error: "Error inesperado al guardar la configuración" };
  }
}
