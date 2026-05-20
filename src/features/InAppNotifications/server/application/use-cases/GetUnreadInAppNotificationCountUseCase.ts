import type { IInAppNotificationRepository } from "../../domain/interfaces/IInAppNotificationRepository";

interface GetUnreadInAppNotificationCountInput {
  tenantId: string;
  userId: string;
}

interface GetUnreadInAppNotificationCountResult {
  success: boolean;
  count?: number;
  error?: string;
}

export class GetUnreadInAppNotificationCountUseCase {
  constructor(private readonly repository: IInAppNotificationRepository) {}

  async execute(
    input: GetUnreadInAppNotificationCountInput
  ): Promise<GetUnreadInAppNotificationCountResult> {
    try {
      const count = await this.repository.getUnreadCount(input);
      return { success: true, count };
    } catch (error) {
      console.error("Error in GetUnreadInAppNotificationCountUseCase:", error);
      return { success: false, error: "No se pudo obtener el conteo de no leídas" };
    }
  }
}
