import prisma from "@/core/lib/prisma";
import { APP_URL } from "@core/shared/constants/app";
import { InngestEvents } from "@core/shared/constants/inngest-events";
import { inngest } from "@core/shared/inngest/inngest";
import { createInAppNotificationsForRecipients } from "@features/InAppNotifications/server/presentation/helpers/createInAppNotificationsForRecipients.helper";
import { SendNotificationUseCase } from "@features/Notifications/server/application/use-cases/SendNotificationUseCase";
import { emailProvider } from "@features/Notifications/server/infrastructure/providers/EmailProvider";
import { prismaNotificationRepository } from "@features/Notifications/server/infrastructure/repositories/PrismaNotificationRepository";
import {
  generateCommitmentDailyReminderEmail,
  generateCommitmentDailyReminderPlainText,
} from "@features/Notifications/server/infrastructure/templates/commitmentDailyReminder.template";
import { GenerateDailyReminderUseCase } from "@features/vacancy/server/application/use-cases/GenerateDailyReminderUseCase";
import { prismaNotificationConfigRepository } from "@features/Sistema/configuracion/server/infrastructure/repositories/PrismaNotificationConfigRepository";
import { prismaVacancyCommitmentRepository } from "@features/vacancy/server/infrastructure/repositories/PrismaVacancyCommitmentRepository";

export const handleCommitmentMorningReminder = inngest.createFunction(
  {
    id: "handle-commitment-morning-reminder",
    name: "Recordatorio matutino de compromisos",
  },
  { cron: "TZ=America/Mexico_City 0 9 * * 1-5" },
  async ({ step }) => {
    const tenants = await step.run("fetch-enabled-tenants", async () => {
      return prisma.notificationConfig.findMany({
        where: {
          enabled: true,
          commitmentMorningReminderEnabled: true,
        },
        select: { tenantId: true },
      });
    });

    if (tenants.length === 0) {
      return { skipped: true, reason: "No tenants with morning reminder enabled" };
    }

    let totalSent = 0;

    for (const tenant of tenants) {
      await step.run(`process-tenant-${tenant.tenantId}`, async () => {
        const useCase = new GenerateDailyReminderUseCase(
          prismaVacancyCommitmentRepository,
          prismaNotificationConfigRepository,
        );

        const result = await useCase.execute({ tenantId: tenant.tenantId });

        if (!result.success || !result.data || result.data.length === 0) {
          return { skipped: true, reason: "No due-today commitments" };
        }

        for (const recruiterData of result.data) {
          const notificationUseCase = new SendNotificationUseCase(prismaNotificationRepository, [
            emailProvider,
          ]);

          const htmlTemplate = generateCommitmentDailyReminderEmail({
            recruiterName: recruiterData.recruiterName || "Reclutador",
            dueTodayCommitments: recruiterData.dueTodayCommitments,
            appUrl: APP_URL,
          });

          const plainText = generateCommitmentDailyReminderPlainText({
            recruiterName: recruiterData.recruiterName || "Reclutador",
            dueTodayCommitments: recruiterData.dueTodayCommitments,
            appUrl: APP_URL,
          });

          await notificationUseCase.execute({
            tenantId: tenant.tenantId,
            provider: "EMAIL",
            recipient: recruiterData.recruiterEmail,
            subject: `⏰ Recordatorio: ${recruiterData.dueTodayCommitments.length} compromiso${recruiterData.dueTodayCommitments.length === 1 ? "" : "s"} que vence${recruiterData.dueTodayCommitments.length === 1 ? "" : "n"} HOY`,
            body: plainText,
            priority: "HIGH",
            metadata: {
              triggerEvent: "COMMITMENT_MORNING_REMINDER",
              htmlTemplate,
            },
          });

          await step.run(
            `create-in-app-notification-commitment-morning-${recruiterData.recruiterId}`,
            async () => {
              await createInAppNotificationsForRecipients([
                {
                  userId: recruiterData.recruiterId,
                  tenantId: tenant.tenantId,
                  type: "COMMITMENT_MORNING_REMINDER",
                  title: "Recordatorio: compromisos de hoy",
                  body: `Tiene ${recruiterData.dueTodayCommitments.length} compromisos programados para hoy.`,
                  resourceType: "commitment",
                  actionUrl: "/compromisos",
                },
              ]);
            },
          );

          totalSent++;
        }

        return { sent: result.data.length };
      });
    }

    return { sent: true, totalEmailsSent: totalSent };
  },
);
