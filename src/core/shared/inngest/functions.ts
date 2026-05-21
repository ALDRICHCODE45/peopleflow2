import prisma from "@/core/lib/prisma";
import { inngest } from "./inngest";
import { InngestEvents } from "@core/shared/constants/inngest-events";
import { APP_URL } from "@core/shared/constants/app";
import { getMexicoDayRangeUTC } from "@core/shared/helpers/timezone";
import { SendNotificationUseCase } from "@features/Notifications/server/application/use-cases/SendNotificationUseCase";
import { prismaNotificationRepository } from "@features/Notifications/server/infrastructure/repositories/PrismaNotificationRepository";
import { emailProvider } from "@features/Notifications/server/infrastructure/providers/EmailProvider";
import {
  generateLeadInactivityAlertEmail,
  generateLeadInactivityAlertPlainText,
} from "@features/Notifications/server/infrastructure/templates/leadInactivityAlertTemplate";
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
import { STATUS_LABELS } from "@features/Leads/server/presentation/inngest/constants";

// Function 1: Inactivity alert with configurable sleep
export const handleLeadInactivityAlert = inngest.createFunction(
  {
    id: "handle-lead-inactivity-alert",
    name: "Alerta de inactividad de Lead",
    cancelOn: [
      {
        event: InngestEvents.lead.statusChanged,
        match: "data.leadId",
      },
    ],
  },
  { event: InngestEvents.lead.statusChanged },
  async ({ event, step }) => {
    const { tenantId, newStatus, companyName, leadId, changedById } = event.data;

    // Step 1: Load config and check if inactivity monitoring applies
    const config = await step.run("load-config", async () => {
      return prisma.notificationConfig.findUnique({
        where: { tenantId },
      });
    });

    if (!config?.enabled || !config.leadInactiveEnabled) {
      return { skipped: true, reason: "Inactivity monitoring disabled" };
    }

    const monitoredStatuses = config.leadInactiveStatuses as string[];
    if (!monitoredStatuses.includes(newStatus)) {
      return { skipped: true, reason: "Status not monitored for inactivity" };
    }

    // Step 2: Sleep for configured duration
    const unit = config.leadInactiveTimeUnit === "HOURS" ? "h" : "d";
    const sleepDuration = `${config.leadInactiveTimeValue}${unit}`;
    await step.sleep("wait-for-inactivity", sleepDuration);

    // Step 3: Verify lead is still in the same status
    const currentLead = await step.run("verify-lead-status", async () => {
      return prisma.lead.findFirst({
        where: { id: leadId, tenantId, isDeleted: false },
        select: {
          status: true,
          companyName: true,
          assignedTo: {
            select: {
              name: true,
            },
          },
        },
      });
    });

    if (!currentLead || currentLead.status !== newStatus) {
      return { skipped: true, reason: "Lead status changed during sleep" };
    }

    // Step 4: Re-load config (it may have changed during the sleep period)
    const freshConfig = await step.run("reload-config", async () => {
      return prisma.notificationConfig.findUnique({
        where: { tenantId },
      });
    });

    if (
      !freshConfig?.enabled ||
      !freshConfig.leadInactiveEnabled ||
      freshConfig.recipientUserIds.length === 0
    ) {
      return { skipped: true, reason: "Config changed during sleep" };
    }

    // Step 5: Fetch recipients and send alerts
    const recipients = await step.run("fetch-recipients", async () => {
      return prisma.user.findMany({
        where: { id: { in: freshConfig.recipientUserIds } },
        select: { id: true, email: true, name: true },
      });
    });

    if (recipients.length === 0) {
      return { skipped: true, reason: "No valid recipients" };
    }

    const tenantName = await step.run("get-tenant-name", async () => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
      });
      return tenant?.name ?? "Tenant no identificado";
    });

    const statusLabel = STATUS_LABELS[newStatus] || newStatus;
    const inactiveDuration = `${config.leadInactiveTimeValue} ${config.leadInactiveTimeUnit === "HOURS" ? "horas" : "días"}`;
    const leadName = currentLead.companyName || companyName;
    const assignedToName = currentLead.assignedTo?.name || "Sin generador asignado";

    for (const recipient of recipients) {
      await step.run(`send-inactivity-alert-${recipient.id}`, async () => {
        const notificationUseCase = new SendNotificationUseCase(
          prismaNotificationRepository,
          [emailProvider],
        );

        const recipientName = recipient.name || "Usuario";
        const emailData = {
          recipientName,
          leadName,
          assignedToName,
          tenantName,
          currentStatus: statusLabel,
          inactiveDuration,
          appUrl: APP_URL,
        };

        const htmlTemplate = generateLeadInactivityAlertEmail(emailData);
        const plainTextBody = generateLeadInactivityAlertPlainText(emailData);

        await notificationUseCase.execute({
          tenantId,
          provider: "EMAIL",
          recipient: recipient.email,
          subject: `Lead "${leadName}" de ${tenantName} asignado a ${assignedToName} sin actividad por ${inactiveDuration}`,
          body: plainTextBody,
          priority: "HIGH",
          metadata: {
            leadId,
            leadName,
            tenantName,
            assignedToName,
            triggerEvent: "LEAD_INACTIVITY_ALERT",
            currentStatus: newStatus,
            inactiveDuration,
            htmlTemplate,
          },
          createdById: changedById,
        });
      });
    }

    await step.run("create-in-app-notification-lead-inactive", async () => {
      if (freshConfig.recipientUserIds.length === 0) {
        return;
      }

      await createInAppNotificationsForRecipients(
        freshConfig.recipientUserIds.map((recipientUserId) => ({
          userId: recipientUserId,
          tenantId,
          type: "LEAD_INACTIVE",
          title: "Lead inactivo",
          body: `El lead ${leadName} ha estado inactivo por ${inactiveDuration}.`,
          resourceType: "lead",
          resourceId: leadId,
          actionUrl: `/leads/${leadId}`,
          triggeredByUserId: changedById,
          metadata: { currentStatus: newStatus, inactiveDuration },
        })),
      );
    });

    return { sent: true, recipientCount: recipients.length };
  },
);

// Function 3: Entry date reminder for PRE_PLACEMENT vacancies
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

    // Step 1: Sleep until entry date
    await step.sleepUntil("wait-until-entry-date", new Date(entryDate));

    // Step 2: Verify vacancy is still in PRE_PLACEMENT
    const vacancy = await step.run("verify-vacancy-status", async () => {
      return prisma.vacancy.findFirst({
        where: { id: vacancyId, tenantId },
        select: { status: true },
      });
    });

    if (!vacancy || vacancy.status !== "PRE_PLACEMENT") {
      return { skipped: true, reason: "Vacancy no longer in PRE_PLACEMENT" };
    }

    // Step 3: Fetch recruiter email
    const recruiter = await step.run("fetch-recruiter", async () => {
      return prisma.user.findFirst({
        where: { id: recruiterId },
        select: { email: true, name: true },
      });
    });

    if (!recruiter?.email) {
      return { skipped: true, reason: "Recruiter not found" };
    }

    // Step 4: Fetch hired candidate name via FK
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

    // Step 5: Send email
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

// Function 4: Placement congrats email
export const handleVacancyPlacementCongratsEmail = inngest.createFunction(
  {
    id: "handle-vacancy-placement-congrats-email",
    name: "Email de felicitaciones por placement",
  },
  { event: InngestEvents.vacancy.placementCongratsEmail },
  async ({ event, step }) => {
    const { vacancyId, tenantId, vacancyPosition, candidateName, candidateEmail } =
      event.data;

    if (!candidateEmail) {
      return { skipped: true, reason: "No candidate email" };
    }

    // Get vacancy entry date and verify hired candidate
    const vacancy = await step.run("fetch-vacancy", async () => {
      return prisma.vacancy.findFirst({
        where: { id: vacancyId, tenantId },
        select: {
          entryDate: true,
          createdById: true,
          hiredCandidate: {
            select: { email: true, status: true },
          },
        },
      });
    });

    // Defense in depth: verify the hired candidate is CONTRATADO and email matches
    if (vacancy?.hiredCandidate) {
      const hired = vacancy.hiredCandidate;
      if (hired.status !== "CONTRATADO") {
        console.warn(
          `[PlacementCongrats] Hired candidate for vacancy ${vacancyId} is not CONTRATADO (status: ${hired.status}). Skipping email.`
        );
        return { skipped: true, reason: "Hired candidate not CONTRATADO" };
      }
      if (hired.email !== candidateEmail) {
        console.warn(
          `[PlacementCongrats] Email mismatch for vacancy ${vacancyId}: event has ${candidateEmail}, hired candidate has ${hired.email}. Skipping email.`
        );
        return { skipped: true, reason: "Candidate email mismatch with hired candidate" };
      }
    }

    const formattedDate = vacancy?.entryDate
      ? new Date(vacancy.entryDate).toLocaleDateString("es-MX", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "próximamente";

    await step.run("send-congrats-email", async () => {
      const notificationUseCase = new SendNotificationUseCase(
        prismaNotificationRepository,
        [emailProvider],
      );

      const emailData = {
        candidateName,
        vacancyPosition,
        entryDate: formattedDate,
        appUrl: APP_URL,
      };

      await notificationUseCase.execute({
        tenantId,
        provider: "EMAIL",
        recipient: candidateEmail,
        subject: `¡Felicitaciones ${candidateName}! Bienvenido(a) a "${vacancyPosition}"`,
        body: generateVacancyPlacementCongratsPlainText(emailData),
        priority: "HIGH",
        metadata: {
          vacancyId,
          vacancyPosition,
          triggerEvent: "VACANCY_PLACEMENT_CONGRATS",
          htmlTemplate: generateVacancyPlacementCongratsEmail(emailData),
        },
        createdById: vacancy?.createdById ?? "system",
      });
    });

    return { sent: true };
  },
);

// Function 6: Vacancy countdown reminders before targetDeliveryDate
const VACANCY_TERMINAL_STATUSES = ["CANCELADA", "PERDIDA", "STAND_BY", "PLACEMENT"] as const;

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

    // Step 1: Load config
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

    // Step 2: For each checkpoint, sleepUntil and send
    for (const daysAhead of daysBefore) {
      const notifyDate = new Date(targetDate);
      notifyDate.setDate(notifyDate.getDate() - daysAhead);

      // Skip if notify date is already in the past
      if (notifyDate <= new Date()) continue;

      await step.sleepUntil(`wait-${daysAhead}d-before`, notifyDate);

      // Verify vacancy is still active
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

      // Reload config (may have changed during sleep)
      const freshConfig = await step.run(`reload-config-${daysAhead}d`, async () => {
        return prisma.notificationConfig.findUnique({ where: { tenantId } });
      });

      if (!freshConfig?.enabled || !freshConfig.vacancyCountdownEnabled) {
        return { skipped: true, reason: "Countdown disabled during sleep" };
      }

      // Gather recipients: recruiter + configured recipients
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

      // Send email to each recipient
      for (const recipient of recipients) {
        await step.run(
          `send-countdown-${daysAhead}d-${recipient.email}`,
          async () => {
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
          },
        );
      }
    }

    // Final checkpoint: the day of targetDeliveryDate (daysRemaining = 0)
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
        await step.run(
          `send-countdown-day-of-${recipient.email}`,
          async () => {
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
          },
        );
      }
    }

    return { sent: true, reason: "Countdown sequence completed" };
  },
);

// Function 7: Stale vacancy repeating notification
function formatDuration(value: number, unit: string): string {
  return unit === "HOURS" ? `${value}h` : `${value}d`;
}

const VACANCY_STATUS_DISPLAY: Record<string, string> = {
  QUICK_MEETING: "Quick Meeting",
  HUNTING: "Hunting",
  FOLLOW_UP: "Follow Up",
  PRE_PLACEMENT: "Pre-Placement",
  PLACEMENT: "Placement",
  STAND_BY: "Stand By",
  CANCELADA: "Cancelada",
  PERDIDA: "Perdida",
};

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
  handleLeadInactivityAlert,
  handleVacancyPrePlacementEntryReminder,
  handleVacancyPlacementCongratsEmail,
  handleVacancyCountdownNotification,
  handleVacancyStaleNotification,
  handleCommitmentMeetingReport,
  handleCommitmentMorningReminder,
  handleCommitmentEveningAdminReport,
];
