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
  generateLeadInactivityAlertEmail,
  generateLeadInactivityAlertPlainText,
} from "@features/Notifications/server/infrastructure/templates/leadInactivityAlertTemplate";

export const handleLeadInactivityAlert = inngest.createFunction(
  {
    id: "handle-lead-inactivity-alert",
    name: "Alerta de inactividad de Lead",
    cancelOn: [
      {
        event: InngestEvents.lead.statusChanged,
        match: "data.leadId",
      },
    ],
  },
  { event: InngestEvents.lead.statusChanged },
  async ({ event, step }) => {
    const { tenantId, newStatus, companyName, leadId, changedById } = event.data;
    const config = await step.run("load-config", async () => {
      return prisma.notificationConfig.findUnique({ where: { tenantId } });
    });
    if (!config?.enabled || !config.leadInactiveEnabled) {
      return { skipped: true, reason: "Inactivity monitoring disabled" };
    }
    const monitoredStatuses = config.leadInactiveStatuses as string[];
    if (!monitoredStatuses.includes(newStatus)) {
      return { skipped: true, reason: "Status not monitored for inactivity" };
    }
    const unit = config.leadInactiveTimeUnit === "HOURS" ? "h" : "d";
    const sleepDuration = `${config.leadInactiveTimeValue}${unit}`;
    await step.sleep("wait-for-inactivity", sleepDuration);

    const currentLead = await step.run("verify-lead-status", async () => {
      return prisma.lead.findFirst({
        where: { id: leadId, tenantId, isDeleted: false },
        select: {
          status: true,
          companyName: true,
          assignedTo: { select: { name: true } },
        },
      });
    });
    if (!currentLead || currentLead.status !== newStatus) {
      return { skipped: true, reason: "Lead status changed during sleep" };
    }

    const freshConfig = await step.run("reload-config", async () => {
      return prisma.notificationConfig.findUnique({ where: { tenantId } });
    });
    if (
      !freshConfig?.enabled ||
      !freshConfig.leadInactiveEnabled ||
      freshConfig.recipientUserIds.length === 0
    ) {
      return { skipped: true, reason: "Config changed during sleep" };
    }

    const recipients = await step.run("fetch-recipients", async () => {
      return prisma.user.findMany({
        where: { id: { in: freshConfig.recipientUserIds } },
        select: { id: true, email: true, name: true },
      });
    });
    if (recipients.length === 0) {
      return { skipped: true, reason: "No valid recipients" };
    }

    const tenantName = await step.run("get-tenant-name", async () => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
      });
      return tenant?.name ?? "Tenant no identificado";
    });

    const statusLabel = STATUS_LABELS[newStatus] || newStatus;
    const inactiveDuration = `${config.leadInactiveTimeValue} ${config.leadInactiveTimeUnit === "HOURS" ? "horas" : "días"}`;
    const leadName = currentLead.companyName || companyName;
    const assignedToName = currentLead.assignedTo?.name || "Sin generador asignado";

    for (const recipient of recipients) {
      await step.run(`send-inactivity-alert-${recipient.id}`, async () => {
        const notificationUseCase = new SendNotificationUseCase(
          prismaNotificationRepository,
          [emailProvider],
        );

        const recipientName = recipient.name || "Usuario";
        const emailData = {
          recipientName,
          leadName,
          assignedToName,
          tenantName,
          currentStatus: statusLabel,
          inactiveDuration,
          appUrl: APP_URL,
        };

        const htmlTemplate = generateLeadInactivityAlertEmail(emailData);
        const plainTextBody = generateLeadInactivityAlertPlainText(emailData);

        await notificationUseCase.execute({
          tenantId,
          provider: "EMAIL",
          recipient: recipient.email,
          subject: `Lead "${leadName}" de ${tenantName} asignado a ${assignedToName} sin actividad por ${inactiveDuration}`,
          body: plainTextBody,
          priority: "HIGH",
          metadata: {
            leadId,
            leadName,
            tenantName,
            assignedToName,
            triggerEvent: "LEAD_INACTIVITY_ALERT",
            currentStatus: newStatus,
            inactiveDuration,
            htmlTemplate,
          },
          createdById: changedById,
        });
      });
    }

    await step.run("create-in-app-notification-lead-inactive", async () => {
      if (freshConfig.recipientUserIds.length === 0) {
        return;
      }

      await createInAppNotificationsForRecipients(
        freshConfig.recipientUserIds.map((recipientUserId) => ({
          userId: recipientUserId,
          tenantId,
          type: "LEAD_INACTIVE",
          title: "Lead inactivo",
          body: `El lead ${leadName} ha estado inactivo por ${inactiveDuration}.`,
          resourceType: "lead",
          resourceId: leadId,
          actionUrl: `/leads/${leadId}`,
          triggeredByUserId: changedById,
          metadata: { currentStatus: newStatus, inactiveDuration },
        })),
      );
    });

    return { sent: true, recipientCount: recipients.length };
  },
);
