"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { prismaInAppNotificationRepository } from "../../infrastructure/repositories/PrismaInAppNotificationRepository";
import { ListInAppNotificationsUseCase } from "../../application/use-cases/ListInAppNotificationsUseCase";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { ServerErrors } from "@core/shared/constants/error-messages";
import type { ListInAppNotificationsResult } from "../../../frontend/types/inAppNotification.types";

interface ListInAppNotificationsInput {
  unreadOnly?: boolean;
  limit?: number;
  cursor?: string;
}

export async function listInAppNotificationsAction(
  input: ListInAppNotificationsInput = {}
): Promise<ListInAppNotificationsResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: ServerErrors.notAuthenticated };

    const tenantId = await getActiveTenantId();
    if (!tenantId) return { error: ServerErrors.noActiveTenant };

    const result = await new ListInAppNotificationsUseCase(
      prismaInAppNotificationRepository
    ).execute({
      tenantId,
      userId: session.user.id,
      unreadOnly: input.unreadOnly,
      limit: input.limit ?? 20,
      cursor: input.cursor,
    });

    if (!result.success || !result.data) {
      return { error: result.error ?? "Error al listar notificaciones" };
    }

    return { error: null, data: result.data };
  } catch (error) {
    console.error("Error in listInAppNotificationsAction:", error);
    return { error: "Error inesperado" };
  }
}
