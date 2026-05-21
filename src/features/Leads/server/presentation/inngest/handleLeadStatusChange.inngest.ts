import prisma from "@/core/lib/prisma";
import { APP_URL } from "@core/shared/constants/app";
import { InngestEvents } from "@core/shared/constants/inngest-events";
import { inngest } from "@core/shared/inngest/inngest";
import { createInAppNotificationsForRecipients } from "@features/InAppNotifications/server/presentation/helpers/createInAppNotificationsForRecipients.helper";
import { STATUS_LABELS } from "@features/Leads/server/presentation/inngest/constants";
import { SendNotificationUseCase } from "@features/Notifications/server/application/use-cases/SendNotificationUseCase";
import { emailProvider } from "@features/Notifications/server/infrastructure/providers/EmailProvider";
import { prismaNotificationRepository } from "@features/Notifications/server/infrastructure/repositories/PrismaNotificationRepository";
import {
  generateLeadStatusChangeEmail,
  generateLeadStatusChangePlainText,
} from "@features/Notifications/server/infrastructure/templates/leadStatusChangeTemplate";
import {
  generateLeadToClientConversionEmail,
  generateLeadToClientConversionPlainText,
} from "@features/Notifications/server/infrastructure/templates/leadToClientConversionTemplate";

export const handleLeadStatusChangeNotification = inngest.createFunction(
  {
    id: "handle-lead-status-change-notification",
    name: "Notificación de cambio de estado de Lead",
  },
  { event: InngestEvents.lead.statusChanged },
  async ({ event, step }) => {
    const { tenantId, newStatus, companyName, leadId, changedById } = event.data;
    const config = await step.run("load-config", async () => {
      const config = await prisma.notificationConfig.findUnique({ where: { tenantId } });
      return config;
    });
    if (!config?.enabled || !config.leadStatusChangeEnabled) {
      return { skipped: true, reason: "Notifications disabled" };
    }
    const triggers = config.leadStatusChangeTriggers as string[];
    if (!triggers.includes(newStatus)) {
      return { skipped: true, reason: "Status not in triggers" };
    }
    if (config.recipientUserIds.length === 0) {
      return { skipped: true, reason: "No recipients configured" };
    }
    const recipients = await step.run("fetch-recipients", async () => {
      return prisma.user.findMany({
        where: { id: { in: config.recipientUserIds } },
        select: { id: true, email: true, name: true },
      });
    });
    if (recipients.length === 0) {
      return { skipped: true, reason: "No valid recipients found" };
    }
    const leadTenantContext = await step.run("fetch-lead-tenant-context", async () => {
      const [tenant, lead] = await Promise.all([
        prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
        prisma.lead.findFirst({
          where: { id: leadId, tenantId, isDeleted: false },
          select: { companyName: true, assignedTo: { select: { name: true } } },
        }),
      ]);
      return {
        tenantName: tenant?.name ?? "Tenant no identificado",
        leadName: lead?.companyName ?? companyName,
        assignedToName: lead?.assignedTo?.name ?? "Sin generador asignado",
      };
    });

    const isConversion = newStatus === "POSICIONES_ASIGNADAS";
    const statusLabel = STATUS_LABELS[newStatus] || newStatus;

    for (const recipient of recipients) {
      await step.run(`send-email-${recipient.id}`, async () => {
        const notificationUseCase = new SendNotificationUseCase(
          prismaNotificationRepository,
          [emailProvider],
        );
        const recipientName = recipient.name || "Usuario";
        let htmlTemplate: string;
        let plainTextBody: string;
        let subject: string;
        if (isConversion) {
          const emailData = {
            recipientName,
            leadName: leadTenantContext.leadName,
            assignedToName: leadTenantContext.assignedToName,
            tenantName: leadTenantContext.tenantName,
            appUrl: APP_URL,
          };
          htmlTemplate = generateLeadToClientConversionEmail(emailData);
          plainTextBody = generateLeadToClientConversionPlainText(emailData);
          subject = `Lead "${leadTenantContext.leadName}" de ${leadTenantContext.tenantName} asignado a ${leadTenantContext.assignedToName} ahora es Cliente`;
        } else {
          const emailData = {
            recipientName,
            leadName: leadTenantContext.leadName,
            assignedToName: leadTenantContext.assignedToName,
            tenantName: leadTenantContext.tenantName,
            newStatus: statusLabel,
            appUrl: APP_URL,
          };
          htmlTemplate = generateLeadStatusChangeEmail(emailData);
          plainTextBody = generateLeadStatusChangePlainText(emailData);
          subject = `Lead "${leadTenantContext.leadName}" de ${leadTenantContext.tenantName} asignado a ${leadTenantContext.assignedToName} cambió a ${statusLabel}`;
        }

        await notificationUseCase.execute({
          tenantId,
          provider: "EMAIL",
          recipient: recipient.email,
          subject,
          body: plainTextBody,
          priority: isConversion ? "HIGH" : "MEDIUM",
          metadata: {
            leadId,
            leadName: leadTenantContext.leadName,
            tenantName: leadTenantContext.tenantName,
            assignedToName: leadTenantContext.assignedToName,
            triggerEvent: isConversion
              ? "LEAD_TO_CLIENT_CONVERSION"
              : "LEAD_STATUS_CHANGE",
            newStatus,
            htmlTemplate,
          },
          createdById: changedById,
        });
      });
    }

    await step.run("create-in-app-notification-lead-status-changed", async () => {
      if (config.recipientUserIds.length === 0) {
        return;
      }
      const statusLabelForNotification = STATUS_LABELS[newStatus] || newStatus;
      await createInAppNotificationsForRecipients(
        config.recipientUserIds.map((recipientUserId) => ({
          userId: recipientUserId,
          tenantId,
          type: "LEAD_STATUS_CHANGED",
          title: "Cambio de estado en lead",
          body: `El lead ${leadTenantContext.leadName} cambió de estado a ${statusLabelForNotification}.`,
          resourceType: "lead",
          resourceId: leadId,
          actionUrl: `/leads/${leadId}`,
          triggeredByUserId: changedById,
          metadata: { newStatus },
        })),
      );
    });

    return { sent: true, recipientCount: recipients.length };
  },
);
