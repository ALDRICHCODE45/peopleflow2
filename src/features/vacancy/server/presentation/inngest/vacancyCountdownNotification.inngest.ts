import prisma from "@/core/lib/prisma";
import { InngestEvents } from "@core/shared/constants/inngest-events";
import { inngest } from "@core/shared/inngest/inngest";
import { VACANCY_TERMINAL_STATUSES } from "@features/vacancy/server/presentation/inngest/constants";

export const handleVacancyCountdownNotification = inngest.createFunction(
  {
    id: "vacancy-countdown-notification",
    name: "Recordatorios de countdown antes de entrega de vacante",
    cancelOn: [
      {
        event: InngestEvents.vacancy.countdownSchedule,
        match: "data.vacancyId",
      },
    ],
  },
  { event: InngestEvents.vacancy.countdownSchedule },
  async ({ event, step }) => {
    const {
      vacancyId,
      tenantId,
      targetDeliveryDate,
      vacancyPosition,
      clientName,
      recruiterId,
      recruiterName,
      recruiterEmail,
    } = event.data;

    const config = await step.run("load-config", async () => {
      return prisma.notificationConfig.findUnique({ where: { tenantId } });
    });

    if (!config?.enabled || !config.vacancyCountdownEnabled) {
      return { skipped: true, reason: "Countdown notifications disabled" };
    }

    const daysBefore = [
      ...((config.vacancyCountdownDaysBefore as number[] | null) ?? [3, 1]),
    ].sort((a, b) => b - a);
    const targetDate = new Date(targetDeliveryDate);

    for (const daysAhead of daysBefore) {
      const notifyDate = new Date(targetDate);
      notifyDate.setDate(notifyDate.getDate() - daysAhead);

      if (notifyDate <= new Date()) continue;

      await step.sleepUntil(`wait-${daysAhead}d-before`, notifyDate);

      const vacancy = await step.run(`check-vacancy-${daysAhead}d`, async () => {
        return prisma.vacancy.findUnique({
          where: { id: vacancyId },
          select: { status: true, actualDeliveryDate: true, targetDeliveryDate: true },
        });
      });

      if (
        !vacancy ||
        vacancy.actualDeliveryDate ||
        VACANCY_TERMINAL_STATUSES.includes(
          vacancy.status as (typeof VACANCY_TERMINAL_STATUSES)[number],
        )
      ) {
        return { skipped: true, reason: "Vacancy completed or terminal" };
      }

      const freshConfig = await step.run(`reload-config-${daysAhead}d`, async () => {
        return prisma.notificationConfig.findUnique({ where: { tenantId } });
      });

      if (!freshConfig?.enabled || !freshConfig.vacancyCountdownEnabled) {
        return { skipped: true, reason: "Countdown disabled during sleep" };
      }

      const recipients = await step.run(`get-recipients-${daysAhead}d`, async () => {
        const recipientIds = freshConfig.recipientUserIds ?? [];
        const users =
          recipientIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: recipientIds } },
                select: { id: true, name: true, email: true },
              })
            : [];
        const allRecipients = [
          { id: recruiterId, name: recruiterName, email: recruiterEmail },
          ...users
            .filter((u) => u.id !== recruiterId)
            .map((u) => ({ id: u.id, name: u.name, email: u.email })),
        ];
        return allRecipients;
      });

      for (const recipient of recipients) {
        await step.run(`send-countdown-${daysAhead}d-${recipient.email}`, async () => {
          await inngest.send({
            name: InngestEvents.email.send,
            data: {
              template: "vacancy-countdown" as const,
              tenantId,
              triggeredById: recruiterId,
              data: {
                recipientName: recipient.name ?? "Usuario",
                recipientEmail: recipient.email,
                vacancyPosition,
                clientName,
                daysRemaining: daysAhead,
                targetDate: targetDeliveryDate,
                vacancyId,
                recipientUserId: recipient.id,
              },
            },
          });
        });
      }
    }

    if (targetDate > new Date()) {
      await step.sleepUntil("wait-day-of", targetDate);

      const vacancy = await step.run("check-vacancy-day-of", async () => {
        return prisma.vacancy.findUnique({
          where: { id: vacancyId },
          select: { status: true, actualDeliveryDate: true },
        });
      });

      if (
        !vacancy ||
        vacancy.actualDeliveryDate ||
        VACANCY_TERMINAL_STATUSES.includes(
          vacancy.status as (typeof VACANCY_TERMINAL_STATUSES)[number],
        )
      ) {
        return { skipped: true, reason: "Vacancy completed before day-of" };
      }

      const dayOfConfig = await step.run("reload-config-day-of", async () => {
        return prisma.notificationConfig.findUnique({ where: { tenantId } });
      });

      if (!dayOfConfig?.enabled || !dayOfConfig.vacancyCountdownEnabled) {
        return { skipped: true, reason: "Countdown disabled before day-of" };
      }

      const dayOfRecipients = await step.run("get-recipients-day-of", async () => {
        const recipientIds = dayOfConfig.recipientUserIds ?? [];
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

      for (const recipient of dayOfRecipients) {
        await step.run(`send-countdown-day-of-${recipient.email}`, async () => {
          await inngest.send({
            name: InngestEvents.email.send,
            data: {
              template: "vacancy-countdown" as const,
              tenantId,
              triggeredById: recruiterId,
              data: {
                recipientName: recipient.name ?? "Usuario",
                recipientEmail: recipient.email,
                vacancyPosition,
                clientName,
                daysRemaining: 0,
                targetDate: targetDeliveryDate,
                vacancyId,
                recipientUserId: recipient.id,
              },
            },
          });
        });
      }
    }

    return { sent: true, reason: "Countdown sequence completed" };
  },
);
