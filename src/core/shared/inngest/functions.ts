import prisma from "@/core/lib/prisma";
import { inngest } from "./inngest";
import { InngestEvents } from "@core/shared/constants/inngest-events";
import { APP_URL } from "@core/shared/constants/app";
import { getMexicoDayRangeUTC } from "@core/shared/helpers/timezone";
import { SendNotificationUseCase } from "@features/Notifications/server/application/use-cases/SendNotificationUseCase";
import { prismaNotificationRepository } from "@features/Notifications/server/infrastructure/repositories/PrismaNotificationRepository";
import { emailProvider } from "@features/Notifications/server/infrastructure/providers/EmailProvider";
import {
  generateCommitmentMeetingReportEmail,
  generateCommitmentMeetingReportPlainText,
} from "@features/Notifications/server/infrastructure/templates/commitmentMeetingReport.template";
import {
  generateCommitmentAdminMeetingReportEmail,
  generateCommitmentAdminMeetingReportPlainText,
} from "@features/Notifications/server/infrastructure/templates/commitmentAdminMeetingReport.template";
import {
  generateCommitmentDailyReminderEmail,
  generateCommitmentDailyReminderPlainText,
} from "@features/Notifications/server/infrastructure/templates/commitmentDailyReminder.template";
import {
  generateCommitmentEveningAdminReportEmail,
  generateCommitmentEveningAdminReportPlainText,
} from "@features/Notifications/server/infrastructure/templates/commitmentEveningAdminReport.template";
import { GenerateMeetingReportUseCase } from "@features/vacancy/server/application/use-cases/GenerateMeetingReportUseCase";
import { GenerateDailyReminderUseCase } from "@features/vacancy/server/application/use-cases/GenerateDailyReminderUseCase";
import { GenerateEveningAdminReportUseCase } from "@features/vacancy/server/application/use-cases/GenerateEveningAdminReportUseCase";
import { prismaVacancyCommitmentRepository } from "@features/vacancy/server/infrastructure/repositories/PrismaVacancyCommitmentRepository";
import { prismaNotificationConfigRepository } from "@features/Sistema/configuracion/server/infrastructure/repositories/PrismaNotificationConfigRepository";
import { createInAppNotificationsForRecipients } from "@features/InAppNotifications/server/presentation/helpers/createInAppNotificationsForRecipients.helper";
// Helper: Inngest step.run() serializes Date → string. Rehydrate before passing to templates.
function rehydrateReportRow<T extends { dueDate: unknown; createdAt: unknown; completedAt: unknown }>(
  row: T,
): T & { dueDate: Date; createdAt: Date; completedAt: Date | null } {
  return {
    ...row,
    dueDate: new Date(row.dueDate as string),
    createdAt: new Date(row.createdAt as string),
    completedAt: row.completedAt ? new Date(row.completedAt as string) : null,
  };
}

// Function 8: Manual post-meeting commitment report
export const handleCommitmentMeetingReport = inngest.createFunction(
  {
    id: "handle-commitment-meeting-report",
    name: "Reporte de compromisos post-junta",
  },
  { event: InngestEvents.commitment.meetingReportRequested },
  async ({ event, step }) => {
    const { tenantId, triggeredByUserId } = event.data;

    // Calculate Mexico timezone meeting window: start of day → now (proper UTC range)
    const { startOfDay } = getMexicoDayRangeUTC();

    // Step 1: Generate meeting report
    const reportData = await step.run("generate-meeting-report", async () => {
      const useCase = new GenerateMeetingReportUseCase(
        prismaVacancyCommitmentRepository,
        prismaNotificationConfigRepository
      );
      return useCase.execute({
        tenantId,
        from: startOfDay,
        to: new Date(), // use actual UTC now for the upper bound
      });
    });

    if (!reportData.success || !reportData.data) {
      return { skipped: true, reason: reportData.error ?? "No data" };
    }

    const { recruiterReports, adminRecipients } = reportData.data;

    if (recruiterReports.length === 0 && adminRecipients.length === 0) {
      return {
        skipped: true,
        reason: recruiterReports.length === 0
          ? "No commitments created in meeting window"
          : "No admin recipients configured",
      };
    }

    // Step 2: Send recruiter emails
    for (const recruiterReport of recruiterReports) {
      await step.run(`send-recruiter-email-${recruiterReport.recruiterId}`, async () => {
        const notificationUseCase = new SendNotificationUseCase(
          prismaNotificationRepository,
          [emailProvider]
        );

        const hydratedCommitments = recruiterReport.commitments.map(rehydrateReportRow);
        const dueTodayIds = recruiterReport.dueToday.map((c) => c.commitmentId);

        const htmlTemplate = generateCommitmentMeetingReportEmail({
          recruiterName: recruiterReport.recruiterName || "Reclutador",
          commitments: hydratedCommitments,
          dueTodayCommitmentIds: dueTodayIds,
          appUrl: APP_URL,
        });

        const plainText = generateCommitmentMeetingReportPlainText({
          recruiterName: recruiterReport.recruiterName || "Reclutador",
          commitments: hydratedCommitments,
          dueTodayCommitmentIds: dueTodayIds,
          appUrl: APP_URL,
        });

        await notificationUseCase.execute({
          tenantId,
          provider: "EMAIL",
          recipient: recruiterReport.recruiterEmail,
          subject: `Reporte de Compromisos de Junta — ${recruiterReport.commitments.length} compromisos`,
          body: plainText,
          priority: "MEDIUM",
          metadata: {
            triggerEvent: "COMMITMENT_MEETING_REPORT",
            htmlTemplate,
          },
          createdById: triggeredByUserId,
        });
      });
    }

    // Step 3: Send admin email (admins receive report even if no per-recruiter emails)
    if (adminRecipients.length > 0) {
      const allCommitments = recruiterReports.flatMap((r) => r.commitments).map(rehydrateReportRow);
      const allDueTodayIds = recruiterReports.flatMap((r) =>
        r.dueToday.map((c) => c.commitmentId)
      );

      const adminUsers = await step.run("fetch-admin-users", async () => {
        return prisma.user.findMany({
          where: { id: { in: adminRecipients } },
          select: { id: true, name: true, email: true },
        });
      });

      for (const admin of adminUsers) {
        await step.run(`send-admin-email-${admin.id}`, async () => {
          const notificationUseCase = new SendNotificationUseCase(
            prismaNotificationRepository,
            [emailProvider]
          );

          const htmlTemplate = generateCommitmentAdminMeetingReportEmail({
            adminName: admin.name || "Administrador",
            allCommitments,
            dueTodayCommitmentIds: allDueTodayIds,
            appUrl: APP_URL,
          });

          const plainText = generateCommitmentAdminMeetingReportPlainText({
            adminName: admin.name || "Administrador",
            allCommitments,
            dueTodayCommitmentIds: allDueTodayIds,
            appUrl: APP_URL,
          });

          await notificationUseCase.execute({
            tenantId,
            provider: "EMAIL",
            recipient: admin.email,
            subject: `Reporte Administrativo de Compromisos — ${allCommitments.length} compromisos`,
            body: plainText,
            priority: "MEDIUM",
            metadata: {
              triggerEvent: "COMMITMENT_ADMIN_MEETING_REPORT",
              htmlTemplate,
            },
            createdById: triggeredByUserId,
          });
        });
      }
    }

    return {
      sent: true,
      recruiterCount: recruiterReports.length,
      adminCount: adminRecipients.length,
    };
  }
);

// Function 9: Morning cron — daily recruiter reminder for due-today commitments
export const handleCommitmentMorningReminder = inngest.createFunction(
  {
    id: "handle-commitment-morning-reminder",
    name: "Recordatorio matutino de compromisos",
  },
  { cron: "TZ=America/Mexico_City 0 9 * * 1-5" },
  async ({ step }) => {
    // Step 1: Get all tenants with morning reminder enabled
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

    // Step 2: Process each tenant in isolation
    for (const tenant of tenants) {
      await step.run(`process-tenant-${tenant.tenantId}`, async () => {
        const useCase = new GenerateDailyReminderUseCase(
          prismaVacancyCommitmentRepository,
          prismaNotificationConfigRepository
        );

        const result = await useCase.execute({ tenantId: tenant.tenantId });

        if (!result.success || !result.data || result.data.length === 0) {
          return { skipped: true, reason: "No due-today commitments" };
        }

        // Send email to each recruiter
        for (const recruiterData of result.data) {
          const notificationUseCase = new SendNotificationUseCase(
            prismaNotificationRepository,
            [emailProvider]
          );

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
  }
);

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
  handleCommitmentMeetingReport,
  handleCommitmentMorningReminder,
  handleCommitmentEveningAdminReport,
];
