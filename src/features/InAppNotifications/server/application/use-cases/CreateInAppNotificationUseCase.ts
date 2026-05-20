import type { InAppNotification } from "../../domain/entities/InAppNotification";
import type {
  CreateInAppNotificationData,
  IInAppNotificationRepository,
} from "../../domain/interfaces/IInAppNotificationRepository";

interface CreateInAppNotificationResult {
  success: boolean;
  notification?: InAppNotification;
  error?: string;
}

export class CreateInAppNotificationUseCase {
  constructor(private readonly repository: IInAppNotificationRepository) {}

  async execute(
    input: CreateInAppNotificationData
  ): Promise<CreateInAppNotificationResult> {
    try {
      const notification = await this.repository.create(input);
      return { success: true, notification };
    } catch (error) {
      console.error("Error in CreateInAppNotificationUseCase:", error);
      return { success: false, error: "No se pudo crear la notificación" };
    }
  }
}
