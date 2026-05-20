import type { IInAppNotificationRepository } from "../../domain/interfaces/IInAppNotificationRepository";

interface MarkInAppNotificationAsReadInput {
  id: string;
  tenantId: string;
  userId: string;
}

interface MarkInAppNotificationAsReadResult {
  success: boolean;
  error?: string;
}

export class MarkInAppNotificationAsReadUseCase {
  constructor(private readonly repository: IInAppNotificationRepository) {}

  async execute(
    input: MarkInAppNotificationAsReadInput
  ): Promise<MarkInAppNotificationAsReadResult> {
    try {
      await this.repository.markAsRead(input);
      return { success: true };
    } catch (error) {
      console.error("Error in MarkInAppNotificationAsReadUseCase:", error);
      return { success: false, error: "No se pudo marcar la notificación como leída" };
    }
  }
}
