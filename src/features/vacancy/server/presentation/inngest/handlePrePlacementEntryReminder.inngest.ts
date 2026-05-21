import prisma from "@/core/lib/prisma";
import { InngestEvents } from "@core/shared/constants/inngest-events";
import { APP_URL } from "@core/shared/constants/app";
import { inngest } from "@core/shared/inngest/inngest";
import { SendNotificationUseCase } from "@features/Notifications/server/application/use-cases/SendNotificationUseCase";
import { emailProvider } from "@features/Notifications/server/infrastructure/providers/EmailProvider";
import { prismaNotificationRepository } from "@features/Notifications/server/infrastructure/repositories/PrismaNotificationRepository";
import {
  generateVacancyEntryReminderEmail,
  generateVacancyEntryReminderPlainText,
} from "@features/Notifications/server/infrastructure/templates/vacancyPrePlacementEntryReminderTemplate";

export const handleVacancyPrePlacementEntryReminder = inngest.createFunction(
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

    await step.sleepUntil("wait-until-entry-date", new Date(entryDate));

    const vacancy = await step.run("verify-vacancy-status", async () => {
      return prisma.vacancy.findFirst({
        where: { id: vacancyId, tenantId },
        select: { status: true },
      });
    });

    if (!vacancy || vacancy.status !== "PRE_PLACEMENT") {
      return { skipped: true, reason: "Vacancy no longer in PRE_PLACEMENT" };
    }

    const recruiter = await step.run("fetch-recruiter", async () => {
      return prisma.user.findFirst({
        where: { id: recruiterId },
        select: { email: true, name: true },
      });
    });

    if (!recruiter?.email) {
      return { skipped: true, reason: "Recruiter not found" };
    }

    const hiredCandidate = await step.run("fetch-hired-candidate", async () => {
      const v = await prisma.vacancy.findFirst({
        where: { id: vacancyId, tenantId },
        select: {
          hiredCandidate: {
            select: { firstName: true, lastName: true },
          },
        },
      });
      return v?.hiredCandidate ?? null;
    });

    const candidateName = hiredCandidate
      ? `${hiredCandidate.firstName} ${hiredCandidate.lastName}`
      : "el candidato";

    const formattedDate = new Date(entryDate).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

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
        vacancyId,
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
