import type { IInAppNotificationRepository } from "../../domain/interfaces/IInAppNotificationRepository";

export interface ApplyInAppNotificationRetentionInput {
  userId: string;
  tenantId: string;
}

export interface ApplyInAppNotificationRetentionOutput {
  success: boolean;
  data?: { archived: number; deleted: number };
  error?: string;
}

export class ApplyInAppNotificationRetentionUseCase {
  constructor(private readonly repo: IInAppNotificationRepository) {}

  async execute(
    input: ApplyInAppNotificationRetentionInput,
  ): Promise<ApplyInAppNotificationRetentionOutput> {
    try {
      const result = await this.repo.applyRetentionForUser({
        userId: input.userId,
        tenantId: input.tenantId,
        archiveReadOlderThanDays: 30,
        archiveUnreadOlderThanDays: 90,
        hardDeleteArchivedOlderThanDays: 180,
        maxActive: 500,
      });

      return { success: true, data: result };
    } catch (error) {
      console.error("ApplyInAppNotificationRetentionUseCase failed:", error);
      return { success: false, error: "Error applying retention" };
    }
  }
}
