"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { prismaInAppNotificationRepository } from "../../infrastructure/repositories/PrismaInAppNotificationRepository";
import { MarkAllInAppNotificationsAsReadUseCase } from "../../application/use-cases/MarkAllInAppNotificationsAsReadUseCase";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { ServerErrors } from "@core/shared/constants/error-messages";
import type { MarkAllInAppNotificationsAsReadResult } from "../../../frontend/types/inAppNotification.types";

export async function markAllInAppNotificationsAsReadAction(): Promise<MarkAllInAppNotificationsAsReadResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: ServerErrors.notAuthenticated };

    const tenantId = await getActiveTenantId();
    if (!tenantId) return { error: ServerErrors.noActiveTenant };

    const result = await new MarkAllInAppNotificationsAsReadUseCase(
      prismaInAppNotificationRepository
    ).execute({
      tenantId,
      userId: session.user.id,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al marcar notificaciones" };
    }

    return { error: null, data: { count: result.count ?? 0 } };
  } catch (error) {
    console.error("Error in markAllInAppNotificationsAsReadAction:", error);
    return { error: "Error inesperado" };
  }
}
