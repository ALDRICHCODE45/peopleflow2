import prisma from "@/core/lib/prisma";
import { APP_URL } from "@core/shared/constants/app";
import { inngest } from "@core/shared/inngest/inngest";
import { createInAppNotificationsForRecipients } from "@features/InAppNotifications/server/presentation/helpers/createInAppNotificationsForRecipients.helper";
import { SendNotificationUseCase } from "@features/Notifications/server/application/use-cases/SendNotificationUseCase";
import { emailProvider } from "@features/Notifications/server/infrastructure/providers/EmailProvider";
import { prismaNotificationRepository } from "@features/Notifications/server/infrastructure/repositories/PrismaNotificationRepository";
import {
  generateCommitmentEveningAdminReportEmail,
  generateCommitmentEveningAdminReportPlainText,
} from "@features/Notifications/server/infrastructure/templates/commitmentEveningAdminReport.template";
import { GenerateEveningAdminReportUseCase } from "@features/vacancy/server/application/use-cases/GenerateEveningAdminReportUseCase";
import { prismaNotificationConfigRepository } from "@features/Sistema/configuracion/server/infrastructure/repositories/PrismaNotificationConfigRepository";
import { prismaVacancyCommitmentRepository } from "@features/vacancy/server/infrastructure/repositories/PrismaVacancyCommitmentRepository";

export const handleCommitmentEveningAdminReport = inngest.createFunction(
  {
    id: "handle-commitment-evening-admin-report",
    name: "Reporte vespertino de compromisos para admins",
  },
  { cron: "TZ=America/Mexico_City 0 16 * * 1-5" },
  async ({ step }) => {
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

    for (const tenant of tenants) {
      const reportData = await step.run(`compute-report-${tenant.tenantId}`, async () => {
        const useCase = new GenerateEveningAdminReportUseCase(
          prismaVacancyCommitmentRepository,
          prismaNotificationConfigRepository,
        );

        const result = await useCase.execute({ tenantId: tenant.tenantId });

        if (!result.success || !result.data) {
          return null;
        }

        const { dueTodayCommitments, adminRecipients } = result.data;

        if (dueTodayCommitments.length === 0 || adminRecipients.length === 0) {
          return null;
        }

        const adminUsers = await prisma.user.findMany({
          where: { id: { in: adminRecipients } },
          select: { id: true, name: true, email: true },
        });

        if (adminUsers.length === 0) {
          return null;
        }

        return { dueTodayCommitments, adminUsers };
      });

      if (!reportData) {
        continue;
      }

      for (const admin of reportData.adminUsers) {
        await step.run(`send-email-evening-${tenant.tenantId}-${admin.id}`, async () => {
          const notificationUseCase = new SendNotificationUseCase(prismaNotificationRepository, [
            emailProvider,
          ]);

          const dueTodayCommitments = reportData.dueTodayCommitments.map((commitment) => ({
            ...commitment,
            dueDate: new Date(commitment.dueDate),
            createdAt: new Date(commitment.createdAt),
            completedAt: commitment.completedAt ? new Date(commitment.completedAt) : null,
          }));

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
            subject: `📅 Reporte Vespertino de Compromisos — ${reportData.dueTodayCommitments.length} compromisos que vencían hoy`,
            body: plainText,
            priority: "MEDIUM",
            metadata: {
              triggerEvent: "COMMITMENT_EVENING_ADMIN_REPORT",
              htmlTemplate,
            },
          });

          return { sent: true };
        });

        await step.run(`in-app-evening-${tenant.tenantId}-${admin.id}`, async () => {
          await createInAppNotificationsForRecipients([
            {
              userId: admin.id,
              tenantId: tenant.tenantId,
              type: "COMMITMENT_EVENING_ADMIN_REPORT",
              title: "Reporte vespertino de compromisos",
              body: `Resumen de compromisos del día: ${reportData.dueTodayCommitments.length} compromisos vencían hoy.`,
              resourceType: "commitment",
              actionUrl: "/compromisos",
            },
          ]);

          return { created: true };
        });
      }

      totalSent += reportData.adminUsers.length;
    }

    return { sent: true, totalEmailsSent: totalSent };
  },
);
