import prisma from "@/core/lib/prisma";
import { InngestEvents } from "@core/shared/constants/inngest-events";
import { APP_URL } from "@core/shared/constants/app";
import { inngest } from "@core/shared/inngest/inngest";
import { SendNotificationUseCase } from "@features/Notifications/server/application/use-cases/SendNotificationUseCase";
import { emailProvider } from "@features/Notifications/server/infrastructure/providers/EmailProvider";
import { prismaNotificationRepository } from "@features/Notifications/server/infrastructure/repositories/PrismaNotificationRepository";
import {
  generateVacancyPlacementCongratsEmail,
  generateVacancyPlacementCongratsPlainText,
} from "@features/Notifications/server/infrastructure/templates/vacancyPlacementCongratsTemplate";

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
        return {
          skipped: true,
          reason: "Candidate email mismatch with hired candidate",
        };
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
