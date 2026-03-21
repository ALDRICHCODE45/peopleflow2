"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import prisma from "@/core/lib/prisma";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { inngest } from "@/core/shared/inngest/inngest";
import { InngestEvents } from "@core/shared/constants/inngest-events";
import { ServerErrors } from "@core/shared/constants/error-messages";

const RESOURCE_LABELS: Record<string, string> = {
  JOB_DESCRIPTION: "Job Description",
  PERFIL_MUESTRA: "Perfiles Muestra",
  CHECKLIST: "Checklist",
  TERNA: "Terna (candidatos)",
};

type ValidationResource =
  | "JOB_DESCRIPTION"
  | "PERFIL_MUESTRA"
  | "CHECKLIST"
  | "TERNA";

export interface RequestValidationResult {
  error: string | null;
}

export async function requestValidationAction(input: {
  vacancyId: string;
  resources: ValidationResource[];
}): Promise<RequestValidationResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: ServerErrors.notAuthenticated };

    const tenantId = await getActiveTenantId();
    if (!tenantId) return { error: ServerErrors.noActiveTenant };

    // Load vacancy via domain repository
    const vacancy = await prismaVacancyRepository.findById(
      input.vacancyId,
      tenantId,
    );
    if (!vacancy) return { error: "Vacante no encontrada" };

    // Resolve client name if not already in the domain entity
    const clientName =
      vacancy.clientName ??
      (await prismaVacancyRepository.findClientNameById(
        vacancy.clientId,
        tenantId,
      )) ??
      "Cliente";

    // Load notification config
    const config = await prisma.notificationConfig.findUnique({
      where: { tenantId },
    });

    if (!config?.enabled) {
      return {
        error:
          "Las notificaciones están desactivadas. Activálas en Sistema > Configuración.",
      };
    }

    if (config.recipientUserIds.length === 0) {
      return {
        error:
          "No hay usuarios configurados para recibir notificaciones. Configuralo en Sistema > Configuración.",
      };
    }

    // Fetch recipient users
    const recipients = await prisma.user.findMany({
      where: { id: { in: config.recipientUserIds } },
      select: { id: true, email: true, name: true },
    });

    if (recipients.length === 0) {
      return {
        error:
          "No se encontraron usuarios válidos para notificar. Revisá la configuración en Sistema > Configuración.",
      };
    }

    // Get tenant name for the email
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    const tenantName = tenant?.name ?? "Tu organización";
    const requesterName = session.user.name ?? "Un reclutador";
    const resourceLabels = input.resources.map(
      (r) => RESOURCE_LABELS[r] ?? r,
    );

    // Send one Inngest event per recipient
    for (const recipient of recipients) {
      await inngest.send({
        name: InngestEvents.email.send,
        data: {
          template: "validation-request" as const,
          tenantId,
          triggeredById: session.user.id,
          data: {
            recipientName: recipient.name ?? "Usuario",
            recipientEmail: recipient.email,
            requesterName,
            vacancyPosition: vacancy.position,
            clientName,
            resources: resourceLabels,
            vacancyId: vacancy.id,
            tenantName,
          },
        },
      });
    }

    return { error: null };
  } catch (error) {
    console.error("Error in requestValidationAction:", error);
    return { error: "Error inesperado al enviar la solicitud" };
  }
}
