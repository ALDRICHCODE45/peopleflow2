"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { prismaInAppNotificationRepository } from "../../infrastructure/repositories/PrismaInAppNotificationRepository";
import { MarkInAppNotificationAsReadUseCase } from "../../application/use-cases/MarkInAppNotificationAsReadUseCase";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { ServerErrors } from "@core/shared/constants/error-messages";
import type { MarkInAppNotificationAsReadResult } from "../../../frontend/types/inAppNotification.types";

interface MarkInAppNotificationAsReadInput {
  id: string;
}

export async function markInAppNotificationAsReadAction(
  input: MarkInAppNotificationAsReadInput
): Promise<MarkInAppNotificationAsReadResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: ServerErrors.notAuthenticated };

    const tenantId = await getActiveTenantId();
    if (!tenantId) return { error: ServerErrors.noActiveTenant };

    const result = await new MarkInAppNotificationAsReadUseCase(
      prismaInAppNotificationRepository
    ).execute({
      id: input.id,
      tenantId,
      userId: session.user.id,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al marcar la notificación" };
    }

    return { error: null, data: { success: true } };
  } catch (error) {
    console.error("Error in markInAppNotificationAsReadAction:", error);
    return { error: "Error inesperado" };
  }
}
