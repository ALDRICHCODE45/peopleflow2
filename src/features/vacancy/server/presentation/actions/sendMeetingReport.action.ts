"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { ServerErrors } from "@core/shared/constants/error-messages";
import { inngest } from "@core/shared/inngest/inngest";
import { InngestEvents } from "@core/shared/constants/inngest-events";
import { prismaNotificationConfigRepository } from "@features/Sistema/configuracion/server/infrastructure/repositories/PrismaNotificationConfigRepository";

export interface SendMeetingReportResult {
  error: string | null;
  queued?: boolean;
}

export async function sendMeetingReportAction(): Promise<SendMeetingReportResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { error: ServerErrors.notAuthenticated };
    }

    const tenantId = await getActiveTenantId();
    if (!tenantId) {
      return { error: ServerErrors.noActiveTenant };
    }

    // Permission check
    const hasPermission = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [PermissionActions.vacantes.gestionar],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para enviar reportes de compromisos" };
    }

    // Check if meeting report notifications are enabled
    const config = await prismaNotificationConfigRepository.findByTenantId(tenantId);
    if (!config?.enabled || !config.commitmentMeetingReportEnabled) {
      return {
        error: "Las notificaciones de reporte de compromisos están desactivadas. Actívalas en Configuración > Notificaciones > Compromisos.",
      };
    }

    // Emit Inngest event (async processing)
    await inngest.send({
      name: InngestEvents.commitment.meetingReportRequested,
      data: {
        tenantId,
        triggeredByUserId: session.user.id,
      },
    });

    return { error: null, queued: true };
  } catch (error) {
    console.error("Error in sendMeetingReportAction:", error);
    return { error: "Error inesperado al enviar reporte" };
  }
}
