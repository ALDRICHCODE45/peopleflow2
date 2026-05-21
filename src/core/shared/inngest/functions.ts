import prisma from "@/core/lib/prisma";
import { inngest } from "./inngest";
import { APP_URL } from "@core/shared/constants/app";
import { InngestEvents } from "@core/shared/constants/inngest-events";
import { SendNotificationUseCase } from "@features/Notifications/server/application/use-cases/SendNotificationUseCase";
import { emailProvider } from "@features/Notifications/server/infrastructure/providers/EmailProvider";
import { prismaNotificationRepository } from "@features/Notifications/server/infrastructure/repositories/PrismaNotificationRepository";
import {
  generateCommitmentEveningAdminReportEmail,
  generateCommitmentEveningAdminReportPlainText,
} from "@features/Notifications/server/infrastructure/templates/commitmentEveningAdminReport.template";
import { GenerateEveningAdminReportUseCase } from "@features/vacancy/server/application/use-cases/GenerateEveningAdminReportUseCase";
import { prismaVacancyCommitmentRepository } from "@features/vacancy/server/infrastructure/repositories/PrismaVacancyCommitmentRepository";
import { prismaNotificationConfigRepository } from "@features/Sistema/configuracion/server/infrastructure/repositories/PrismaNotificationConfigRepository";
import { createInAppNotificationsForRecipients } from "@features/InAppNotifications/server/presentation/helpers/createInAppNotificationsForRecipients.helper";

// Function 10: Evening cron — daily admin report of due-today commitments
export const handleCommitmentEveningAdminReport = inngest.createFunction(
  {
    id: "handle-commitment-evening-admin-report",
    name: "Reporte vespertino de compromisos para admins",
  },
  { cron: "TZ=America/Mexico_City 0 16 * * 1-5" },
  async ({ step }) => {
    // Step 1: Get all tenants with evening report enabled
    const tenants = await step.run("fetch-enabled-tenants", async () => {
      return prisma.notificationConfig.findMany({
        where: {
          enabled: true,
          commitmentEveningReportEnabled: true,
        },
        select: { tenantId: true },
      });
    });

    if (tenants.length === 0) {
      return { skipped: true, reason: "No tenants with evening report enabled" };
    }

    let totalSent = 0;

    // Step 2: Process each tenant in isolation
    for (const tenant of tenants) {
      await step.run(`process-tenant-${tenant.tenantId}`, async () => {
        const useCase = new GenerateEveningAdminReportUseCase(
          prismaVacancyCommitmentRepository,
          prismaNotificationConfigRepository
        );

        const result = await useCase.execute({ tenantId: tenant.tenantId });

        if (!result.success || !result.data) {
          return { skipped: true, reason: result.error ?? "No data" };
        }

        const { dueTodayCommitments, adminRecipients } = result.data;

        if (dueTodayCommitments.length === 0 || adminRecipients.length === 0) {
          return {
            skipped: true,
            reason: dueTodayCommitments.length === 0
              ? "No commitments due today"
              : "No admin recipients configured",
          };
        }

        // Fetch admin users
        const adminUsers = await prisma.user.findMany({
          where: { id: { in: adminRecipients } },
          select: { id: true, name: true, email: true },
        });

        // Send email to each admin
        for (const admin of adminUsers) {
          const notificationUseCase = new SendNotificationUseCase(
            prismaNotificationRepository,
            [emailProvider]
          );

          const htmlTemplate = generateCommitmentEveningAdminReportEmail({
            adminName: admin.name || "Administrador",
            dueTodayCommitments,
            appUrl: APP_URL,
          });

          const plainText = generateCommitmentEveningAdminReportPlainText({
            adminName: admin.name || "Administrador",
            dueTodayCommitments,
            appUrl: APP_URL,
          });

          await notificationUseCase.execute({
            tenantId: tenant.tenantId,
            provider: "EMAIL",
            recipient: admin.email,
            subject: `📅 Reporte Vespertino de Compromisos — ${dueTodayCommitments.length} compromisos que vencían hoy`,
            body: plainText,
            priority: "MEDIUM",
            metadata: {
              triggerEvent: "COMMITMENT_EVENING_ADMIN_REPORT",
              htmlTemplate,
            },
          });

          await step.run(
            `create-in-app-notification-commitment-evening-admin-${admin.id}`,
            async () => {
              await createInAppNotificationsForRecipients([
                {
                  userId: admin.id,
                  tenantId: tenant.tenantId,
                  type: "COMMITMENT_EVENING_ADMIN_REPORT",
                  title: "Reporte vespertino de compromisos",
                  body: `Resumen de compromisos del día: ${dueTodayCommitments.length} compromisos vencían hoy.`,
                  resourceType: "commitment",
                  actionUrl: "/compromisos",
                },
              ]);
            },
          );

          totalSent++;
        }

        return { sent: adminUsers.length };
      });
    }

    return { sent: true, totalEmailsSent: totalSent };
  }
);

export const functions = [
  handleCommitmentEveningAdminReport,
];
