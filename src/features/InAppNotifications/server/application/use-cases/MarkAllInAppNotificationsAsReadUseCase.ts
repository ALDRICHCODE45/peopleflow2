import type { IInAppNotificationRepository } from "../../domain/interfaces/IInAppNotificationRepository";

interface MarkAllInAppNotificationsAsReadInput {
  tenantId: string;
  userId: string;
}

interface MarkAllInAppNotificationsAsReadResult {
  success: boolean;
  count?: number;
  error?: string;
}

export class MarkAllInAppNotificationsAsReadUseCase {
  constructor(private readonly repository: IInAppNotificationRepository) {}

  async execute(
    input: MarkAllInAppNotificationsAsReadInput
  ): Promise<MarkAllInAppNotificationsAsReadResult> {
    try {
      const count = await this.repository.markAllAsRead(input);
      return { success: true, count };
    } catch (error) {
      console.error("Error in MarkAllInAppNotificationsAsReadUseCase:", error);
      return { success: false, error: "No se pudieron marcar las notificaciones" };
    }
  }
}
