"use server";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { VacancyStatus } from "@/core/generated/prisma/enums";
import { auth } from "@/core/lib/auth";
import { GetVacanciesResult } from "@/features/vacancy/frontend/types/vacancy.types";
import { headers } from "next/headers";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { GetVacanciesUseCase } from "../../application/use-cases/GetVacanciesUseCase";

/**
 * Obtiene todas las vacantes del tenant activo
 */
export async function getVacanciesAction(filters?: {
  status?: VacancyStatus;
  search?: string;
}): Promise<GetVacanciesResult> {
  try {
    //obtener la session del usuario
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", vacancies: [] };
    }

    //obtener el tenant activo del usuario
    const tenantId = await getActiveTenantId();
    if (!tenantId) {
      return { error: "No hay tenant activo", vacancies: [] };
    }

    //verificar los permisos necesarios para ejecutar la accion
    const hasAnyPermissionUseCase = new CheckAnyPermissonUseCase();

    const hasAnyPermission = await hasAnyPermissionUseCase.execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.vacantes.acceder,
        PermissionActions.vacantes.gestionar,
      ],
      tenantId,
    });

    if (!hasAnyPermission) {
      return {
        error: "Error al obtener vacantes",
        vacancies: [],
      };
    }

    //obtener las vacantes actuales
    const useCase = new GetVacanciesUseCase(prismaVacancyRepository);
    const result = await useCase.execute({
      tenantId,
      status: filters?.status,
      search: filters?.search,
    });

    if (!result.success) {
      return {
        error: result.error || "Error al obtener vacantes",
        vacancies: [],
      };
    }

    return {
      error: null,
      vacancies: result.vacancies.map((v) => v.toJSON()),
    };
  } catch (error) {
    console.error("Error getting vacancies:", error);
    return { error: "Error al obtener vacantes", vacancies: [] };
  }
}
