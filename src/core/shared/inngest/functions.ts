import prisma from "@/core/lib/prisma";
import { inngest } from "./inngest";
import { SendNotificationUseCase } from "@features/Notifications/server/application/use-cases/SendNotificationUseCase";
import { prismaNotificationRepository } from "@features/Notifications/server/infrastructure/repositories/PrismaNotificationRepository";
import { emailProvider } from "@features/Notifications/server/infrastructure/providers/EmailProvider";
import {
  generateLeadStatusChangeEmail,
  generateLeadStatusChangePlainText,
} from "@features/Notifications/server/infrastructure/templates/leadStatusChangeTemplate";
import {
  generateLeadToClientConversionEmail,
  generateLeadToClientConversionPlainText,
} from "@features/Notifications/server/infrastructure/templates/leadToClientConversionTemplate";
import {
  generateLeadInactivityAlertEmail,
  generateLeadInactivityAlertPlainText,
} from "@features/Notifications/server/infrastructure/templates/leadInactivityAlertTemplate";

const STATUS_LABELS: Record<string, string> = {
  CONTACTO: "Contacto",
  CONTACTO_CALIDO: "Contacto Cálido",
  SOCIAL_SELLING: "Social Selling",
  CITA_AGENDADA: "Cita Agendada",
  CITA_ATENDIDA: "Cita Atendida",
  CITA_VALIDADA: "Cita Validada",
  POSICIONES_ASIGNADAS: "Posiciones Asignadas",
  STAND_BY: "Stand By",
};

const APP_URL = "https://www.peopleflow.tech";

// Function 1: Immediate notification on lead status change
const handleLeadStatusChangeNotification = inngest.createFunction(
  {
    id: "handle-lead-status-change-notification",
    name: "Notificación de cambio de estado de Lead",
  },
  { event: "lead/status.changed" },
  async ({ event, step }) => {
    const { tenantId, newStatus, companyName, leadId, changedById } =
      event.data;

    // Step 1: Load tenant config and verify it should trigger
    const config = await step.run("load-config", async () => {
      const config = await prisma.notificationConfig.findUnique({
        where: { tenantId },
      });
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

    // Step 2: Fetch recipient users
    const recipients = await step.run("fetch-recipients", async () => {
      return prisma.user.findMany({
        where: { id: { in: config.recipientUserIds } },
        select: { id: true, email: true, name: true },
      });
    });

    if (recipients.length === 0) {
      return { skipped: true, reason: "No valid recipients found" };
    }

    // Step 3: Send notification to each recipient
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
            leadName: companyName,
            appUrl: APP_URL,
          };
          htmlTemplate = generateLeadToClientConversionEmail(emailData);
          plainTextBody = generateLeadToClientConversionPlainText(emailData);
          subject = `Lead "${companyName}" es ahora un Cliente`;
        } else {
          const emailData = {
            recipientName,
            leadName: companyName,
            newStatus: statusLabel,
            appUrl: APP_URL,
          };
          htmlTemplate = generateLeadStatusChangeEmail(emailData);
          plainTextBody = generateLeadStatusChangePlainText(emailData);
          subject = `Lead "${companyName}" cambió a ${statusLabel}`;
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
            leadName: companyName,
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

    return { sent: true, recipientCount: recipients.length };
  },
);

// Function 2: Inactivity alert with configurable sleep
const handleLeadInactivityAlert = inngest.createFunction(
  {
    id: "handle-lead-inactivity-alert",
    name: "Alerta de inactividad de Lead",
    cancelOn: [
      {
        event: "lead/status.changed",
        match: "data.leadId",
      },
    ],
  },
  { event: "lead/status.changed" },
  async ({ event, step }) => {
    const { tenantId, newStatus, companyName, leadId, changedById } =
      event.data;

    // Step 1: Load config and check if inactivity monitoring applies
    const config = await step.run("load-config", async () => {
      return prisma.notificationConfig.findUnique({
        where: { tenantId },
      });
    });

    if (!config?.enabled || !config.leadInactiveEnabled) {
      return { skipped: true, reason: "Inactivity monitoring disabled" };
    }

    const monitoredStatuses = config.leadInactiveStatuses as string[];
    if (!monitoredStatuses.includes(newStatus)) {
      return { skipped: true, reason: "Status not monitored for inactivity" };
    }

    // Step 2: Sleep for configured duration
    const unit = config.leadInactiveTimeUnit === "HOURS" ? "h" : "d";
    const sleepDuration = `${config.leadInactiveTimeValue}${unit}`;
    await step.sleep("wait-for-inactivity", sleepDuration);

    // Step 3: Verify lead is still in the same status
    const currentLead = await step.run("verify-lead-status", async () => {
      return prisma.lead.findFirst({
        where: { id: leadId, tenantId, isDeleted: false },
        select: { status: true, companyName: true },
      });
    });

    if (!currentLead || currentLead.status !== newStatus) {
      return { skipped: true, reason: "Lead status changed during sleep" };
    }

    // Step 4: Re-load config (it may have changed during the sleep period)
    const freshConfig = await step.run("reload-config", async () => {
      return prisma.notificationConfig.findUnique({
        where: { tenantId },
      });
    });

    if (
      !freshConfig?.enabled ||
      !freshConfig.leadInactiveEnabled ||
      freshConfig.recipientUserIds.length === 0
    ) {
      return { skipped: true, reason: "Config changed during sleep" };
    }

    // Step 5: Fetch recipients and send alerts
    const recipients = await step.run("fetch-recipients", async () => {
      return prisma.user.findMany({
        where: { id: { in: freshConfig.recipientUserIds } },
        select: { id: true, email: true, name: true },
      });
    });

    if (recipients.length === 0) {
      return { skipped: true, reason: "No valid recipients" };
    }

    const statusLabel = STATUS_LABELS[newStatus] || newStatus;
    const inactiveDuration = `${config.leadInactiveTimeValue} ${config.leadInactiveTimeUnit === "HOURS" ? "horas" : "días"}`;

    for (const recipient of recipients) {
      await step.run(`send-inactivity-alert-${recipient.id}`, async () => {
        const notificationUseCase = new SendNotificationUseCase(
          prismaNotificationRepository,
          [emailProvider],
        );

        const recipientName = recipient.name || "Usuario";
        const emailData = {
          recipientName,
          leadName: currentLead.companyName,
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
          subject: `Lead "${currentLead.companyName}" sin actividad por ${inactiveDuration}`,
          body: plainTextBody,
          priority: "HIGH",
          metadata: {
            leadId,
            leadName: currentLead.companyName,
            triggerEvent: "LEAD_INACTIVITY_ALERT",
            currentStatus: newStatus,
            inactiveDuration,
            htmlTemplate,
          },
          createdById: changedById,
        });
      });
    }

    return { sent: true, recipientCount: recipients.length };
  },
);

export const functions = [
  handleLeadStatusChangeNotification,
  handleLeadInactivityAlert,
];
