import prisma from "@/core/lib/prisma";
import { InngestEvents } from "@core/shared/constants/inngest-events";
import { inngest } from "@core/shared/inngest/inngest";
import { VACANCY_STATUS_DISPLAY } from "@features/vacancy/server/presentation/inngest/constants";
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

    if (!tenantId) {
      console.error("[vacancy-stale-notification] Missing tenantId in event data", {
        vacancyId,
        newStatus,
      });
      return { skipped: true, reason: "Missing tenantId in event data" };
    }

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

    const initialSleep = formatDuration(
      config.vacancyStaleTimeValue,
      config.vacancyStaleTimeUnit,
    );
    const repeatSleep = formatDuration(
      config.vacancyStaleRepeatValue,
      config.vacancyStaleRepeatUnit,
    );

    await step.sleep("wait-for-stale", initialSleep);

    const vacancy = await step.run("verify-status", async () => {
      return prisma.vacancy.findUnique({
        where: { id: vacancyId },
        select: { status: true },
      });
    });

    if (!vacancy || vacancy.status !== newStatus) {
      return { skipped: true, reason: "Vacancy status changed during initial sleep" };
    }

    let iteration = 0;
    const MAX_ITERATIONS = 52;

    while (iteration < MAX_ITERATIONS) {
      const freshConfig = await step.run(`reload-config-${iteration}`, async () => {
        return prisma.notificationConfig.findUnique({ where: { tenantId } });
      });

      if (!freshConfig?.enabled || !freshConfig.vacancyStaleEnabled) {
        return { skipped: true, reason: "Stale monitoring disabled during loop" };
      }

      const currentVacancy = await step.run(`verify-status-${iteration}`, async () => {
        return prisma.vacancy.findUnique({
          where: { id: vacancyId },
          select: { status: true },
        });
      });

      if (!currentVacancy || currentVacancy.status !== newStatus) {
        return { skipped: true, reason: "Vacancy status changed during loop" };
      }

      const statusEntryIso = await step.run(`get-status-entry-${iteration}`, async () => {
        const history = await prisma.vacancyStatusHistory.findFirst({
          where: {
            vacancyId,
            newStatus: newStatus as
              | "QUICK_MEETING"
              | "HUNTING"
              | "FOLLOW_UP"
              | "PRE_PLACEMENT"
              | "PLACEMENT"
              | "STAND_BY"
              | "PERDIDA"
              | "CANCELADA",
          },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        });
        return history?.createdAt?.toISOString() ?? new Date().toISOString();
      });

      const daysInStatus = Math.floor(
        (Date.now() - new Date(statusEntryIso).getTime()) / (1000 * 60 * 60 * 24),
      );

      const tenantName = await step.run(`get-tenant-${iteration}`, async () => {
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { name: true },
        });
        return tenant?.name ?? "Sistema";
      });

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
      await step.sleep(`repeat-wait-${iteration}`, repeatSleep);
    }

    return { sent: true, reason: "Max iterations reached" };
  },
);
