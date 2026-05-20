"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { prismaInAppNotificationRepository } from "../../infrastructure/repositories/PrismaInAppNotificationRepository";
import { GetUnreadInAppNotificationCountUseCase } from "../../application/use-cases/GetUnreadInAppNotificationCountUseCase";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { ServerErrors } from "@core/shared/constants/error-messages";
import type { GetUnreadInAppNotificationCountResult } from "../../../frontend/types/inAppNotification.types";

export async function getUnreadInAppNotificationCountAction(): Promise<GetUnreadInAppNotificationCountResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: ServerErrors.notAuthenticated };

    const tenantId = await getActiveTenantId();
    if (!tenantId) return { error: ServerErrors.noActiveTenant };

    const result = await new GetUnreadInAppNotificationCountUseCase(
      prismaInAppNotificationRepository
    ).execute({
      tenantId,
      userId: session.user.id,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al obtener notificaciones" };
    }

    return { error: null, data: { count: result.count ?? 0 } };
  } catch (error) {
    console.error("Error in getUnreadInAppNotificationCountAction:", error);
    return { error: "Error inesperado" };
  }
}
