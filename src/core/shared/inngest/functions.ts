import prisma from "@/core/lib/prisma";
import { inngest } from "./inngest";
import { InngestEvents } from "@core/shared/constants/inngest-events";
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
import {
  generateVacancyEntryReminderEmail,
  generateVacancyEntryReminderPlainText,
} from "@features/Notifications/server/infrastructure/templates/vacancyPrePlacementEntryReminderTemplate";
import {
  generateVacancyPlacementCongratsEmail,
  generateVacancyPlacementCongratsPlainText,
} from "@features/Notifications/server/infrastructure/templates/vacancyPlacementCongratsTemplate";
import {
  generateVacancyRecruiterAssignedEmail,
  generateVacancyRecruiterAssignedPlainText,
} from "@features/Notifications/server/infrastructure/templates/vacancyRecruiterAssignedTemplate";
import {
  generateAttachmentRejectedEmail,
  generateAttachmentRejectedPlainText,
} from "@features/Notifications/server/infrastructure/templates/attachmentRejectedTemplate";
import {
  generateChecklistRejectedEmail,
  generateChecklistRejectedPlainText,
} from "@features/Notifications/server/infrastructure/templates/checklistRejectedTemplate";
import {
  generateVacancyStatusHuntingEmail,
  generateVacancyStatusHuntingPlainText,
} from "@features/Notifications/server/infrastructure/templates/vacancyStatusHuntingTemplate";
import {
  generateVacancyStatusFollowUpEmail,
  generateVacancyStatusFollowUpPlainText,
} from "@features/Notifications/server/infrastructure/templates/vacancyStatusFollowUpTemplate";
import {
  generateValidationRequestEmail,
  generateValidationRequestPlainText,
} from "@features/Notifications/server/infrastructure/templates/validationRequestTemplate";

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
  { event: InngestEvents.lead.statusChanged },
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
        event: InngestEvents.lead.statusChanged,
        match: "data.leadId",
      },
    ],
  },
  { event: InngestEvents.lead.statusChanged },
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

// Function 3: Entry date reminder for PRE_PLACEMENT vacancies
const handleVacancyPrePlacementEntryReminder = inngest.createFunction(
  {
    id: "handle-vacancy-pre-placement-entry-reminder",
    name: "Recordatorio de fecha de ingreso en Pre-Placement",
    cancelOn: [
      {
        event: InngestEvents.vacancy.prePlacementEntered,
        match: "data.vacancyId",
      },
    ],
  },
  { event: InngestEvents.vacancy.prePlacementEntered },
  async ({ event, step }) => {
    const { vacancyId, tenantId, recruiterId, vacancyPosition, entryDate } =
      event.data;

    // Step 1: Sleep until entry date
    await step.sleepUntil("wait-until-entry-date", new Date(entryDate));

    // Step 2: Verify vacancy is still in PRE_PLACEMENT
    const vacancy = await step.run("verify-vacancy-status", async () => {
      return prisma.vacancy.findFirst({
        where: { id: vacancyId, tenantId },
        select: { status: true },
      });
    });

    if (!vacancy || vacancy.status !== "PRE_PLACEMENT") {
      return { skipped: true, reason: "Vacancy no longer in PRE_PLACEMENT" };
    }

    // Step 3: Fetch recruiter email
    const recruiter = await step.run("fetch-recruiter", async () => {
      return prisma.user.findFirst({
        where: { id: recruiterId },
        select: { email: true, name: true },
      });
    });

    if (!recruiter?.email) {
      return { skipped: true, reason: "Recruiter not found" };
    }

    // Step 4: Fetch finalist candidate name
    const finalistCandidate = await step.run("fetch-finalist", async () => {
      return prisma.vacancyCandidate.findFirst({
        where: { vacancyId, tenantId, isInTerna: true },
        orderBy: { createdAt: "asc" },
        select: { firstName: true, lastName: true },
      });
    });

    const candidateName = finalistCandidate
      ? `${finalistCandidate.firstName} ${finalistCandidate.lastName}`
      : "el candidato";

    const formattedDate = new Date(entryDate).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Step 5: Send email
    await step.run("send-entry-reminder-email", async () => {
      const notificationUseCase = new SendNotificationUseCase(
        prismaNotificationRepository,
        [emailProvider],
      );

      const emailData = {
        recipientName: recruiter.name || "Reclutador",
        candidateName,
        vacancyPosition,
        entryDate: formattedDate,
        appUrl: APP_URL,
      };

      await notificationUseCase.execute({
        tenantId,
        provider: "EMAIL",
        recipient: recruiter.email,
        subject: `Recordatorio: ${candidateName} ingresa hoy a "${vacancyPosition}"`,
        body: generateVacancyEntryReminderPlainText(emailData),
        priority: "HIGH",
        metadata: {
          vacancyId,
          vacancyPosition,
          triggerEvent: "VACANCY_PRE_PLACEMENT_ENTRY_REMINDER",
          entryDate,
          htmlTemplate: generateVacancyEntryReminderEmail(emailData),
        },
        createdById: recruiterId,
      });
    });

    return { sent: true };
  },
);

// Function 4: Placement congrats email
const handleVacancyPlacementCongratsEmail = inngest.createFunction(
  {
    id: "handle-vacancy-placement-congrats-email",
    name: "Email de felicitaciones por placement",
  },
  { event: InngestEvents.vacancy.placementCongratsEmail },
  async ({ event, step }) => {
    const { vacancyId, tenantId, vacancyPosition, candidateName, candidateEmail } =
      event.data;

    if (!candidateEmail) {
      return { skipped: true, reason: "No candidate email" };
    }

    // Get vacancy entry date
    const vacancy = await step.run("fetch-vacancy", async () => {
      return prisma.vacancy.findFirst({
        where: { id: vacancyId, tenantId },
        select: { entryDate: true, createdById: true },
      });
    });

    const formattedDate = vacancy?.entryDate
      ? new Date(vacancy.entryDate).toLocaleDateString("es-MX", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "próximamente";

    await step.run("send-congrats-email", async () => {
      const notificationUseCase = new SendNotificationUseCase(
        prismaNotificationRepository,
        [emailProvider],
      );

      const emailData = {
        candidateName,
        vacancyPosition,
        entryDate: formattedDate,
        appUrl: APP_URL,
      };

      await notificationUseCase.execute({
        tenantId,
        provider: "EMAIL",
        recipient: candidateEmail,
        subject: `¡Felicitaciones ${candidateName}! Bienvenido(a) a "${vacancyPosition}"`,
        body: generateVacancyPlacementCongratsPlainText(emailData),
        priority: "HIGH",
        metadata: {
          vacancyId,
          vacancyPosition,
          triggerEvent: "VACANCY_PLACEMENT_CONGRATS",
          htmlTemplate: generateVacancyPlacementCongratsEmail(emailData),
        },
        createdById: vacancy?.createdById ?? "system",
      });
    });

    return { sent: true };
  },
);

// Function 5: Generic standalone email queue
const handleSendStandaloneEmail = inngest.createFunction(
  {
    id: "handle-send-standalone-email",
    name: "Cola de emails standalone",
  },
  { event: InngestEvents.email.send },
  async ({ event, step }) => {
    const payload = event.data;

    switch (payload.template) {
      case "recruiter-vacancy-assigned": {
        const { data, tenantId, triggeredById } = payload;

        await step.run("send-recruiter-assigned-email", async () => {
          const notificationUseCase = new SendNotificationUseCase(
            prismaNotificationRepository,
            [emailProvider],
          );

          const emailData = {
            recruiterName: data.recruiterName,
            vacancyPosition: data.vacancyPosition,
            clientName: data.clientName,
            appUrl: APP_URL,
          };

          await notificationUseCase.execute({
            tenantId,
            provider: "EMAIL",
            recipient: data.recruiterEmail,
            subject: `Nueva vacante asignada: ${data.vacancyPosition}`,
            body: generateVacancyRecruiterAssignedPlainText(emailData),
            priority: "MEDIUM",
            metadata: {
              vacancyId: data.vacancyId,
              vacancyPosition: data.vacancyPosition,
              triggerEvent: "VACANCY_RECRUITER_ASSIGNED",
              htmlTemplate: generateVacancyRecruiterAssignedEmail(emailData),
            },
            createdById: triggeredById,
          });
        });

        return { sent: true, template: payload.template };
      }

      case "attachment-rejected": {
        const { data, tenantId, triggeredById } = payload;

        await step.run("send-attachment-rejected-email", async () => {
          const notificationUseCase = new SendNotificationUseCase(
            prismaNotificationRepository,
            [emailProvider],
          );

          const emailData = {
            recruiterName: data.recruiterName,
            vacancyPosition: data.vacancyPosition,
            clientName: data.clientName,
            fileName: data.fileName,
            rejectionReason: data.rejectionReason,
            appUrl: APP_URL,
            vacancyId: data.vacancyId,
          };

          await notificationUseCase.execute({
            tenantId,
            provider: "EMAIL",
            recipient: data.recruiterEmail,
            subject: `Archivo rechazado: ${data.fileName} — ${data.vacancyPosition}`,
            body: generateAttachmentRejectedPlainText(emailData),
            priority: "MEDIUM",
            metadata: {
              vacancyId: data.vacancyId,
              vacancyPosition: data.vacancyPosition,
              fileName: data.fileName,
              triggerEvent: "VACANCY_ATTACHMENT_REJECTED",
              htmlTemplate: generateAttachmentRejectedEmail(emailData),
            },
            createdById: triggeredById,
          });
        });

        return { sent: true, template: payload.template };
      }

      case "checklist-rejected": {
        const { data, tenantId, triggeredById } = payload;

        await step.run("send-checklist-rejected-email", async () => {
          const notificationUseCase = new SendNotificationUseCase(
            prismaNotificationRepository,
            [emailProvider],
          );

          const emailData = {
            recruiterName: data.recruiterName,
            vacancyPosition: data.vacancyPosition,
            clientName: data.clientName,
            rejectionReason: data.rejectionReason,
            appUrl: APP_URL,
            vacancyId: data.vacancyId,
          };

          await notificationUseCase.execute({
            tenantId,
            provider: "EMAIL",
            recipient: data.recruiterEmail,
            subject: `Checklist rechazado — ${data.vacancyPosition}`,
            body: generateChecklistRejectedPlainText(emailData),
            priority: "MEDIUM",
            metadata: {
              vacancyId: data.vacancyId,
              vacancyPosition: data.vacancyPosition,
              triggerEvent: "VACANCY_CHECKLIST_REJECTED",
              htmlTemplate: generateChecklistRejectedEmail(emailData),
            },
            createdById: triggeredById,
          });
        });

        return { sent: true, template: payload.template };
      }

      case "vacancy-status-hunting": {
        const { data, tenantId, triggeredById } = payload;

        await step.run("send-vacancy-status-hunting-email", async () => {
          const notificationUseCase = new SendNotificationUseCase(
            prismaNotificationRepository,
            [emailProvider],
          );

          const emailData = {
            recruiterName: data.recruiterName,
            vacancyPosition: data.vacancyPosition,
            clientName: data.clientName,
            vacancyId: data.vacancyId,
            appUrl: APP_URL,
          };

          await notificationUseCase.execute({
            tenantId,
            provider: "EMAIL",
            recipient: data.recruiterEmail,
            subject: `Tu vacante está lista para Hunting: ${data.vacancyPosition}`,
            body: generateVacancyStatusHuntingPlainText(emailData),
            priority: "MEDIUM",
            metadata: {
              vacancyId: data.vacancyId,
              vacancyPosition: data.vacancyPosition,
              triggerEvent: "VACANCY_STATUS_HUNTING",
              htmlTemplate: generateVacancyStatusHuntingEmail(emailData),
            },
            createdById: triggeredById,
          });
        });

        return { sent: true, template: payload.template };
      }

      case "vacancy-status-follow-up": {
        const { data, tenantId, triggeredById } = payload;

        await step.run("send-vacancy-status-follow-up-email", async () => {
          const notificationUseCase = new SendNotificationUseCase(
            prismaNotificationRepository,
            [emailProvider],
          );

          const emailData = {
            recruiterName: data.recruiterName,
            vacancyPosition: data.vacancyPosition,
            clientName: data.clientName,
            vacancyId: data.vacancyId,
            appUrl: APP_URL,
          };

          await notificationUseCase.execute({
            tenantId,
            provider: "EMAIL",
            recipient: data.recruiterEmail,
            subject: `¡Felicidades! Candidatos entregados: ${data.vacancyPosition}`,
            body: generateVacancyStatusFollowUpPlainText(emailData),
            priority: "MEDIUM",
            metadata: {
              vacancyId: data.vacancyId,
              vacancyPosition: data.vacancyPosition,
              triggerEvent: "VACANCY_STATUS_FOLLOW_UP",
              htmlTemplate: generateVacancyStatusFollowUpEmail(emailData),
            },
            createdById: triggeredById,
          });
        });

        return { sent: true, template: payload.template };
      }

      case "validation-request": {
        const { data, tenantId, triggeredById } = payload;

        await step.run("send-validation-request-email", async () => {
          const notificationUseCase = new SendNotificationUseCase(
            prismaNotificationRepository,
            [emailProvider],
          );

          const emailData = {
            recipientName: data.recipientName,
            requesterName: data.requesterName,
            vacancyPosition: data.vacancyPosition,
            clientName: data.clientName,
            resources: data.resources,
            tenantName: data.tenantName,
            appUrl: APP_URL,
            vacancyId: data.vacancyId,
          };

          await notificationUseCase.execute({
            tenantId,
            provider: "EMAIL",
            recipient: data.recipientEmail,
            subject: `Solicitud de validación — ${data.vacancyPosition}`,
            body: generateValidationRequestPlainText(emailData),
            priority: "HIGH",
            metadata: {
              vacancyId: data.vacancyId,
              vacancyPosition: data.vacancyPosition,
              triggerEvent: "VACANCY_VALIDATION_REQUEST",
              htmlTemplate: generateValidationRequestEmail(emailData),
            },
            createdById: triggeredById,
          });
        });

        return { sent: true, template: payload.template };
      }

      default:
        return { skipped: true, reason: "Unknown template" };
    }
  },
);

export const functions = [
  handleLeadStatusChangeNotification,
  handleLeadInactivityAlert,
  handleVacancyPrePlacementEntryReminder,
  handleVacancyPlacementCongratsEmail,
  handleSendStandaloneEmail,
];
