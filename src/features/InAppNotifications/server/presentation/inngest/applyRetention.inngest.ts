import { inngest } from "@core/shared/inngest/inngest";
import { ApplyInAppNotificationRetentionUseCase } from "@features/InAppNotifications/server/application/use-cases/ApplyInAppNotificationRetentionUseCase";
import { prismaInAppNotificationRepository } from "@features/InAppNotifications/server/infrastructure/repositories/PrismaInAppNotificationRepository";

export const applyInAppNotificationRetention = inngest.createFunction(
  { id: "apply-in-app-notification-retention" },
  { cron: "TZ=America/Mexico_City 0 3 * * *" },
  async ({ step }) => {
    const pairs = await step.run("get-distinct-pairs", async () => {
      return prismaInAppNotificationRepository.getDistinctUserTenantPairs();
    });

    let totalArchived = 0;
    let totalDeleted = 0;

    for (const pair of pairs) {
      const result = await step.run(`retention-${pair.tenantId}-${pair.userId}`, async () => {
        const useCase = new ApplyInAppNotificationRetentionUseCase(
          prismaInAppNotificationRepository,
        );
        return useCase.execute(pair);
      });

      if (result.success && result.data) {
        totalArchived += result.data.archived;
        totalDeleted += result.data.deleted;
      }
    }

    return { usersProcessed: pairs.length, totalArchived, totalDeleted };
  },
);
