import prisma from "@/core/lib/prisma";
import { inngest } from "./inngest";
import { InngestEvents } from "@core/shared/constants/inngest-events";
import { APP_URL } from "@core/shared/constants/app";
import { getMexicoDayRangeUTC } from "@core/shared/helpers/timezone";
import { SendNotificationUseCase } from "@features/Notifications/server/application/use-cases/SendNotificationUseCase";
import { prismaNotificationRepository } from "@features/Notifications/server/infrastructure/repositories/PrismaNotificationRepository";
import { emailProvider } from "@features/Notifications/server/infrastructure/providers/EmailProvider";
import {
  generateVacancyEntryReminderEmail,
  generateVacancyEntryReminderPlainText,
} from "@features/Notifications/server/infrastructure/templates/vacancyPrePlacementEntryReminderTemplate";
import {
  generateVacancyPlacementCongratsEmail,
  generateVacancyPlacementCongratsPlainText,
} from "@features/Notifications/server/infrastructure/templates/vacancyPlacementCongratsTemplate";
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
import {
  VACANCY_STATUS_DISPLAY,
  VACANCY_TERMINAL_STATUSES,
} from "@features/vacancy/server/presentation/inngest/constants";
import { formatDuration } from "@features/vacancy/server/presentation/inngest/helpers/formatDuration";
export const handleVacancyStaleNotification = inngest.createFunction(
  {
    id: "vacancy-stale-notification",
    name: "Alerta de vacante estancada (repetitiva)",
    cancelOn: [
      {
        event: InngestEvents.vacancy.statusChanged,
        match: "data.vacancyId",
      },
    ],
  },
  { event: InngestEvents.vacancy.statusChanged },
  async ({ event, step }) => {
    const {
      vacancyId,
      tenantId,
      newStatus,
      vacancyPosition,
      clientName,
      recruiterId,
      recruiterName,
      recruiterEmail,
    } = event.data;

    // Guard: tenantId is required for all config/notification queries
    if (!tenantId) {
      console.error("[vacancy-stale-notification] Missing tenantId in event data", { vacancyId, newStatus });
      return { skipped: true, reason: "Missing tenantId in event data" };
    }

    // Step 1: Load config and check if monitoring is enabled for this status
    const config = await step.run("load-config", async () => {
      return prisma.notificationConfig.findUnique({ where: { tenantId } });
    });

    if (!config?.enabled || !config.vacancyStaleEnabled) {
      return { skipped: true, reason: "Stale vacancy monitoring disabled" };
    }

    const monitoredStatuses = config.vacancyStaleStatuses as string[];
    if (!monitoredStatuses.includes(newStatus)) {
      return { skipped: true, reason: "Status not monitored for staleness" };
    }

    // Calculate sleep durations from config
    const initialSleep = formatDuration(config.vacancyStaleTimeValue, config.vacancyStaleTimeUnit);
    const repeatSleep = formatDuration(config.vacancyStaleRepeatValue, config.vacancyStaleRepeatUnit);

    // Step 2: Initial sleep (wait for stale threshold)
    await step.sleep("wait-for-stale", initialSleep);

    // Step 3: Verify vacancy is STILL in the same status
    const vacancy = await step.run("verify-status", async () => {
      return prisma.vacancy.findUnique({
        where: { id: vacancyId },
        select: { status: true },
      });
    });

    if (!vacancy || vacancy.status !== newStatus) {
      return { skipped: true, reason: "Vacancy status changed during initial sleep" };
    }

    // Step 4: Enter notification loop
    let iteration = 0;
    const MAX_ITERATIONS = 52; // Safety cap: ~1 year of weekly notifications

    while (iteration < MAX_ITERATIONS) {
      // Reload config each iteration (may have changed)
      const freshConfig = await step.run(`reload-config-${iteration}`, async () => {
        return prisma.notificationConfig.findUnique({ where: { tenantId } });
      });

      if (!freshConfig?.enabled || !freshConfig.vacancyStaleEnabled) {
        return { skipped: true, reason: "Stale monitoring disabled during loop" };
      }

      // Re-verify vacancy status
      const currentVacancy = await step.run(`verify-status-${iteration}`, async () => {
        return prisma.vacancy.findUnique({
          where: { id: vacancyId },
          select: { status: true },
        });
      });

      if (!currentVacancy || currentVacancy.status !== newStatus) {
        return { skipped: true, reason: "Vacancy status changed during loop" };
      }

      // Calculate days in status from status history
      const statusEntryIso = await step.run(`get-status-entry-${iteration}`, async () => {
        const history = await prisma.vacancyStatusHistory.findFirst({
          where: { vacancyId, newStatus: newStatus as "QUICK_MEETING" | "HUNTING" | "FOLLOW_UP" | "PRE_PLACEMENT" | "PLACEMENT" | "STAND_BY" | "PERDIDA" | "CANCELADA" },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        });
        return history?.createdAt?.toISOString() ?? new Date().toISOString();
      });

      const daysInStatus = Math.floor(
        (Date.now() - new Date(statusEntryIso).getTime()) / (1000 * 60 * 60 * 24),
      );

      // Get tenant name
      const tenantName = await step.run(`get-tenant-${iteration}`, async () => {
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { name: true },
        });
        return tenant?.name ?? "Sistema";
      });

      // Get recipients (recruiter + configured users)
      const recipients = await step.run(`get-recipients-${iteration}`, async () => {
        const recipientIds = freshConfig.recipientUserIds ?? [];
        const users =
          recipientIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: recipientIds } },
                select: { id: true, name: true, email: true },
              })
            : [];
        return [
          { id: recruiterId, name: recruiterName, email: recruiterEmail },
          ...users
            .filter((u) => u.id !== recruiterId)
            .map((u) => ({ id: u.id, name: u.name, email: u.email })),
        ];
      });

      const statusLabel = VACANCY_STATUS_DISPLAY[newStatus] ?? newStatus;

      // Send to each recipient
      for (const recipient of recipients) {
        await step.run(`send-stale-${iteration}-${recipient.email}`, async () => {
          await inngest.send({
            name: InngestEvents.email.send,
            data: {
              template: "vacancy-stale-alert" as const,
              tenantId,
              triggeredById: recruiterId,
              data: {
                recipientName: recipient.name ?? "Usuario",
                recipientEmail: recipient.email,
                vacancyPosition,
                clientName,
                currentStatus: statusLabel,
                daysInStatus,
                tenantName,
                vacancyId,
                recipientUserId: recipient.id,
              },
            },
          });
        });
      }

      iteration++;

      // Sleep until next repeat
      await step.sleep(`repeat-wait-${iteration}`, repeatSleep);
    }

    return { sent: true, reason: "Max iterations reached" };
  },
);

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
  handleVacancyStaleNotification,
  handleCommitmentMeetingReport,
  handleCommitmentMorningReminder,
  handleCommitmentEveningAdminReport,
];
