import { InngestEvents } from "@core/shared/constants/inngest-events";
import { APP_URL } from "@core/shared/constants/app";
import { inngest } from "@core/shared/inngest/inngest";
import { SendNotificationUseCase } from "@features/Notifications/server/application/use-cases/SendNotificationUseCase";
import { emailProvider } from "@features/Notifications/server/infrastructure/providers/EmailProvider";
import { prismaNotificationRepository } from "@features/Notifications/server/infrastructure/repositories/PrismaNotificationRepository";
import {
  generateAttachmentRejectedEmail,
  generateAttachmentRejectedPlainText,
} from "@features/Notifications/server/infrastructure/templates/attachmentRejectedTemplate";
import {
  generateChecklistRejectedEmail,
  generateChecklistRejectedPlainText,
} from "@features/Notifications/server/infrastructure/templates/checklistRejectedTemplate";
import {
  generatePasswordChangeCampaignEmail,
  generatePasswordChangeCampaignPlainText,
} from "@features/Notifications/server/infrastructure/templates/passwordChangeCampaignTemplate";
import {
  generateVacancyCountdownEmail,
  generateVacancyCountdownPlainText,
} from "@features/Notifications/server/infrastructure/templates/vacancyCountdownTemplate";
import {
  generateVacancyRecruiterAssignedEmail,
  generateVacancyRecruiterAssignedPlainText,
} from "@features/Notifications/server/infrastructure/templates/vacancyRecruiterAssignedTemplate";
import {
  generateVacancyStaleAlertEmail,
  generateVacancyStaleAlertPlainText,
} from "@features/Notifications/server/infrastructure/templates/vacancyStaleAlertTemplate";
import {
  generateVacancyStatusFollowUpEmail,
  generateVacancyStatusFollowUpPlainText,
} from "@features/Notifications/server/infrastructure/templates/vacancyStatusFollowUpTemplate";
import {
  generateVacancyStatusHuntingEmail,
  generateVacancyStatusHuntingPlainText,
} from "@features/Notifications/server/infrastructure/templates/vacancyStatusHuntingTemplate";
import {
  generateValidationRequestEmail,
  generateValidationRequestPlainText,
} from "@features/Notifications/server/infrastructure/templates/validationRequestTemplate";
import { createInAppNotificationsForRecipients } from "@features/InAppNotifications/server/presentation/helpers/createInAppNotificationsForRecipients.helper";

const handleSendStandaloneEmail = inngest.createFunction(
  {
    id: "handle-send-standalone-email",
    name: "Cola de emails standalone",
    // Procesa hasta 5 emails en paralelo contra el SMTP.
    // Inngest encola el resto y los va liberando segun terminan los anteriores.
    concurrency: { limit: 5 },
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
            vacancyId: data.vacancyId,
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

        await step.run("create-in-app-notification-vacancy-assigned", async () => {
          if (!data.recipientUserId) {
            console.warn(
              "[handleSendStandaloneEmail] Missing recipientUserId for recruiter-vacancy-assigned",
            );
            return;
          }

          await createInAppNotificationsForRecipients([
            {
              userId: data.recipientUserId,
              tenantId,
              type: "VACANCY_ASSIGNED",
              title: "Se le asignó una vacante",
              body: `Se le ha asignado la vacante de ${data.vacancyPosition} para ${data.clientName}. Por favor, revísela.`,
              resourceType: "vacancy",
              resourceId: data.vacancyId,
              actionUrl: `/vacantes/${data.vacancyId}`,
              triggeredByUserId: triggeredById,
            },
          ]);
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

        await step.run("create-in-app-notification-attachment-rejected", async () => {
          if (!data.recipientUserId) {
            console.warn(
              "[handleSendStandaloneEmail] Missing recipientUserId for attachment-rejected",
            );
            return;
          }

          try {
            await createInAppNotificationsForRecipients([
              {
                userId: data.recipientUserId,
                tenantId,
                type: "VACANCY_ATTACHMENT_REJECTED",
                title: `Adjunto rechazado en ${data.vacancyPosition}`,
                body: `Su adjunto ${data.fileName} fue rechazado: ${data.rejectionReason}. Por favor, revíselo y vuelva a subirlo.`,
                resourceType: "vacancy",
                resourceId: data.vacancyId,
                actionUrl: `/reclutamiento/vacantes?vacancyId=${data.vacancyId}`,
                triggeredByUserId: triggeredById,
              },
            ]);
          } catch (error) {
            console.error(
              "[handleSendStandaloneEmail] Failed to create in-app notification for attachment-rejected",
              error,
            );
          }
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

        await step.run("create-in-app-notification-checklist-rejected", async () => {
          if (!data.recipientUserId) {
            console.warn(
              "[handleSendStandaloneEmail] Missing recipientUserId for checklist-rejected",
            );
            return;
          }

          try {
            await createInAppNotificationsForRecipients([
              {
                userId: data.recipientUserId,
                tenantId,
                type: "VACANCY_CHECKLIST_REJECTED",
                title: `Checklist rechazado en ${data.vacancyPosition}`,
                body: `El checklist de la vacante fue rechazado: ${data.rejectionReason}. Por favor, actualice la información solicitada.`,
                resourceType: "vacancy",
                resourceId: data.vacancyId,
                actionUrl: `/reclutamiento/vacantes?vacancyId=${data.vacancyId}`,
                triggeredByUserId: triggeredById,
              },
            ]);
          } catch (error) {
            console.error(
              "[handleSendStandaloneEmail] Failed to create in-app notification for checklist-rejected",
              error,
            );
          }
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

        await step.run("create-in-app-notification-validation-request", async () => {
          if (!data.recipientUserId) {
            console.warn(
              "[handleSendStandaloneEmail] Missing recipientUserId for validation-request",
            );
            return;
          }

          try {
            await createInAppNotificationsForRecipients([
              {
                userId: data.recipientUserId,
                tenantId,
                type: "TERNA_VALIDATION_PENDING",
                title: `Validación pendiente para ${data.vacancyPosition}`,
                body: `${data.requesterName} solicitó validar ${data.resources.join(", ")}. Revise la vacante para continuar el proceso.`,
                resourceType: "vacancy",
                resourceId: data.vacancyId,
                actionUrl: `/reclutamiento/vacantes?vacancyId=${data.vacancyId}`,
                triggeredByUserId: triggeredById,
              },
            ]);
          } catch (error) {
            console.error(
              "[handleSendStandaloneEmail] Failed to create in-app notification for validation-request",
              error,
            );
          }
        });

        return { sent: true, template: payload.template };
      }

      case "vacancy-countdown": {
        const { data, tenantId, triggeredById } = payload;

        await step.run("send-vacancy-countdown-email", async () => {
          const notificationUseCase = new SendNotificationUseCase(
            prismaNotificationRepository,
            [emailProvider],
          );

          const subject =
            data.daysRemaining === 0
              ? `¡Hoy es el día de entrega! ${data.vacancyPosition}`
              : data.daysRemaining === 1
                ? `¡Mañana es la fecha de entrega! ${data.vacancyPosition}`
                : `Faltan ${data.daysRemaining} días para la entrega — ${data.vacancyPosition}`;

          const emailData = {
            recipientName: data.recipientName,
            vacancyPosition: data.vacancyPosition,
            clientName: data.clientName,
            daysRemaining: data.daysRemaining,
            targetDate: data.targetDate,
            vacancyId: data.vacancyId,
            appUrl: APP_URL,
          };

          await notificationUseCase.execute({
            tenantId,
            provider: "EMAIL",
            recipient: data.recipientEmail,
            subject,
            body: generateVacancyCountdownPlainText(emailData),
            priority: data.daysRemaining <= 1 ? "HIGH" : "MEDIUM",
            metadata: {
              vacancyId: data.vacancyId,
              vacancyPosition: data.vacancyPosition,
              triggerEvent: "VACANCY_COUNTDOWN_REMINDER",
              daysRemaining: data.daysRemaining,
              htmlTemplate: generateVacancyCountdownEmail(emailData),
            },
            createdById: triggeredById,
          });
        });

        await step.run("create-in-app-notification-vacancy-countdown", async () => {
          if (!data.recipientUserId) {
            console.warn(
              "[handleSendStandaloneEmail] Missing recipientUserId for vacancy-countdown",
            );
            return;
          }

          await createInAppNotificationsForRecipients([
            {
              userId: data.recipientUserId,
              tenantId,
              type: "VACANCY_COUNTDOWN",
              title: "Vacante próxima a vencer",
              body: `Quedan ${data.daysRemaining} días para entregar la vacante ${data.vacancyPosition} de ${data.clientName}.`,
              resourceType: "vacancy",
              resourceId: data.vacancyId,
              actionUrl: `/vacantes/${data.vacancyId}`,
              triggeredByUserId: triggeredById,
              metadata: { daysRemaining: data.daysRemaining },
            },
          ]);
        });

        return { sent: true, template: payload.template };
      }

      case "vacancy-stale-alert": {
        const { data, tenantId, triggeredById } = payload;

        await step.run("send-vacancy-stale-alert-email", async () => {
          const notificationUseCase = new SendNotificationUseCase(
            prismaNotificationRepository,
            [emailProvider],
          );

          const emailData = {
            recipientName: data.recipientName,
            vacancyPosition: data.vacancyPosition,
            clientName: data.clientName,
            currentStatus: data.currentStatus,
            daysInStatus: data.daysInStatus,
            tenantName: data.tenantName,
            vacancyId: data.vacancyId,
            appUrl: APP_URL,
          };

          await notificationUseCase.execute({
            tenantId,
            provider: "EMAIL",
            recipient: data.recipientEmail,
            subject: `Vacante "${data.vacancyPosition}" lleva ${data.daysInStatus} días en ${data.currentStatus}`,
            body: generateVacancyStaleAlertPlainText(emailData),
            priority: "HIGH",
            metadata: {
              vacancyId: data.vacancyId,
              vacancyPosition: data.vacancyPosition,
              triggerEvent: "VACANCY_STALE_ALERT",
              currentStatus: data.currentStatus,
              daysInStatus: data.daysInStatus,
              htmlTemplate: generateVacancyStaleAlertEmail(emailData),
            },
            createdById: triggeredById,
          });
        });

        await step.run("create-in-app-notification-vacancy-stale", async () => {
          if (!data.recipientUserId) {
            console.warn(
              "[handleSendStandaloneEmail] Missing recipientUserId for vacancy-stale-alert",
            );
            return;
          }

          await createInAppNotificationsForRecipients([
            {
              userId: data.recipientUserId,
              tenantId,
              type: "VACANCY_STALE",
              title: "Vacante estancada",
              body: `La vacante ${data.vacancyPosition} de ${data.clientName} lleva ${data.daysInStatus} en estado ${data.currentStatus}.`,
              resourceType: "vacancy",
              resourceId: data.vacancyId,
              actionUrl: `/vacantes/${data.vacancyId}`,
              triggeredByUserId: triggeredById,
              metadata: { daysInStatus: data.daysInStatus, currentStatus: data.currentStatus },
            },
          ]);
        });

        return { sent: true, template: payload.template };
      }

      case "password-change-campaign": {
        const { data, tenantId, triggeredById } = payload;

        await step.run("send-password-change-campaign-email", async () => {
          const notificationUseCase = new SendNotificationUseCase(
            prismaNotificationRepository,
            [emailProvider],
          );

          const forgotPasswordUrl = `${APP_URL}/forgot-password`;
          const emailData = {
            recipientName: data.recipientName || undefined,
            forgotPasswordUrl,
          };

          const subject = data.isTest
            ? "[PRUEBA] Actualice su contraseña — PeopleFlow"
            : "Actualice su contraseña — PeopleFlow";

          await notificationUseCase.execute({
            tenantId,
            provider: "EMAIL",
            recipient: data.recipientEmail,
            subject,
            body: generatePasswordChangeCampaignPlainText(emailData),
            priority: "MEDIUM",
            metadata: {
              triggerEvent: data.isTest
                ? "PASSWORD_CHANGE_CAMPAIGN_TEST"
                : "PASSWORD_CHANGE_CAMPAIGN",
              htmlTemplate: generatePasswordChangeCampaignEmail(emailData),
            },
            createdById: triggeredById,
          });
        });

        return { sent: true, template: payload.template, isTest: data.isTest };
      }

      default:
        return { skipped: true, reason: "Unknown template" };
    }
  },
);

export { handleSendStandaloneEmail };
