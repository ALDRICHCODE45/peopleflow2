import prisma from "@/core/lib/prisma";
import { InngestEvents } from "@core/shared/constants/inngest-events";
import { APP_URL } from "@core/shared/constants/app";
import { getMexicoDayRangeUTC } from "@core/shared/helpers/timezone";
import { inngest } from "@core/shared/inngest/inngest";
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
import { GenerateMeetingReportUseCase } from "@features/vacancy/server/application/use-cases/GenerateMeetingReportUseCase";
import { prismaNotificationConfigRepository } from "@features/Sistema/configuracion/server/infrastructure/repositories/PrismaNotificationConfigRepository";
import { prismaVacancyCommitmentRepository } from "@features/vacancy/server/infrastructure/repositories/PrismaVacancyCommitmentRepository";
import { rehydrateReportRow } from "@features/vacancy/server/presentation/inngest/helpers/rehydrateReportRow";

export const handleCommitmentMeetingReport = inngest.createFunction(
  {
    id: "handle-commitment-meeting-report",
    name: "Reporte de compromisos post-junta",
  },
  { event: InngestEvents.commitment.meetingReportRequested },
  async ({ event, step }) => {
    const { tenantId, triggeredByUserId } = event.data;

    const { startOfDay } = getMexicoDayRangeUTC();

    const reportData = await step.run("generate-meeting-report", async () => {
      const useCase = new GenerateMeetingReportUseCase(
        prismaVacancyCommitmentRepository,
        prismaNotificationConfigRepository,
      );
      return useCase.execute({
        tenantId,
        from: startOfDay,
        to: new Date(),
      });
    });

    if (!reportData.success || !reportData.data) {
      return { skipped: true, reason: reportData.error ?? "No data" };
    }

    const { recruiterReports, adminRecipients } = reportData.data;

    if (recruiterReports.length === 0 && adminRecipients.length === 0) {
      return {
        skipped: true,
        reason:
          recruiterReports.length === 0
            ? "No commitments created in meeting window"
            : "No admin recipients configured",
      };
    }

    for (const recruiterReport of recruiterReports) {
      await step.run(`send-recruiter-email-${recruiterReport.recruiterId}`, async () => {
        const notificationUseCase = new SendNotificationUseCase(
          prismaNotificationRepository,
          [emailProvider],
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

    if (adminRecipients.length > 0) {
      const allCommitments = recruiterReports
        .flatMap((r) => r.commitments)
        .map(rehydrateReportRow);
      const allDueTodayIds = recruiterReports.flatMap((r) =>
        r.dueToday.map((c) => c.commitmentId),
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
            [emailProvider],
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
  },
);
