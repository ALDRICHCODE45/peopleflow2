"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveTenantId } from "@/features/Leads/server/presentation/helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { GetNotificationConfigUseCase } from "../../application/use-cases/GetNotificationConfigUseCase";
import { SaveNotificationConfigUseCase } from "../../application/use-cases/SaveNotificationConfigUseCase";
import { prismaNotificationConfigRepository } from "../../infrastructure/repositories/PrismaNotificationConfigRepository";
import type { NotificationConfigDTO } from "../../domain/entities/NotificationConfig";
import type { LeadStatus } from "@features/Leads/frontend/types";
import type { VacancyStatusType } from "@features/vacancy/frontend/types/vacancy.types";
import { ServerErrors } from "@core/shared/constants/error-messages";

export interface GetNotificationConfigResult {
  config?: NotificationConfigDTO;
  error?: string;
}

export interface SaveNotificationConfigResult {
  config?: NotificationConfigDTO;
  error?: string;
}

export async function getNotificationConfigAction(): Promise<GetNotificationConfigResult> {
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

    const hasAnyPermissionUseCase = new CheckAnyPermissonUseCase();
    const hasPermission = await hasAnyPermissionUseCase.execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.configuracion.acceder,
        PermissionActions.configuracion.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission.hasAnyPermission) {
      return { error: "No tienes permisos para acceder a la configuración" };
    }

    const useCase = new GetNotificationConfigUseCase(
      prismaNotificationConfigRepository,
    );
    const result = await useCase.execute({ tenantId });

    if (!result.success) {
      return { error: result.error };
    }

    return { config: result.config };
  } catch (error) {
    console.error("Error in getNotificationConfigAction:", error);
    return { error: "Error al obtener la configuración" };
  }
}

export async function saveNotificationConfigAction(data: {
  enabled: boolean;
  recipientUserIds: string[];
  leadStatusChangeEnabled: boolean;
  leadStatusChangeTriggers: LeadStatus[];
  leadInactiveEnabled: boolean;
  leadInactiveStatuses: LeadStatus[];
  leadInactiveTimeValue: number;
  leadInactiveTimeUnit: "HOURS" | "DAYS";
  vacancyCountdownEnabled: boolean;
  vacancyCountdownDaysBefore: number[];
  vacancyStaleEnabled: boolean;
  vacancyStaleStatuses: VacancyStatusType[];
  vacancyStaleTimeValue: number;
  vacancyStaleTimeUnit: "HOURS" | "DAYS";
  vacancyStaleRepeatValue: number;
  vacancyStaleRepeatUnit: "HOURS" | "DAYS";
}): Promise<SaveNotificationConfigResult> {
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

    const hasAnyPermissionUseCase = new CheckAnyPermissonUseCase();
    const hasPermission = await hasAnyPermissionUseCase.execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.configuracion.editar,
        PermissionActions.configuracion.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission.hasAnyPermission) {
      return { error: "No tienes permisos para editar la configuración" };
    }

    const useCase = new SaveNotificationConfigUseCase(
      prismaNotificationConfigRepository,
    );
    const result = await useCase.execute({
      tenantId,
      ...data,
    });

    if (!result.success) {
      return { error: result.error };
    }

    revalidatePath("/sistema/configuracion");
    return { config: result.config };
  } catch (error) {
    console.error("Error in saveNotificationConfigAction:", error);
    return { error: "Error al guardar la configuración" };
  }
}
