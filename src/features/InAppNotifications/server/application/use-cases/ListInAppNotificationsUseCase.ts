import type {
  IInAppNotificationRepository,
  ListInAppNotificationsInput,
} from "../../domain/interfaces/IInAppNotificationRepository";
import type { InAppNotificationDTO } from "../../domain/entities/InAppNotification";

interface ListInAppNotificationsResult {
  success: boolean;
  data?: {
    items: InAppNotificationDTO[];
    nextCursor: string | null;
  };
  error?: string;
}

export class ListInAppNotificationsUseCase {
  constructor(private readonly repository: IInAppNotificationRepository) {}

  async execute(
    input: ListInAppNotificationsInput
  ): Promise<ListInAppNotificationsResult> {
    try {
      const { items, nextCursor } = await this.repository.listForUser(input);
      return {
        success: true,
        data: {
          items: items.map((item) => item.toJSON()),
          nextCursor,
        },
      };
    } catch (error) {
      console.error("Error in ListInAppNotificationsUseCase:", error);
      return { success: false, error: "No se pudieron listar las notificaciones" };
    }
  }
}
