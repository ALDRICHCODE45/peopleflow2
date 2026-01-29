import type { INotificationRepository } from "../../domain/interfaces/INotificationRepository";
import type { INotificationProvider } from "../../domain/interfaces/INotificationProvider";
import type {
  Notification,
  NotificationProvider,
  NotificationPriority,
} from "../../domain/entities/Notification";

export interface SendNotificationInput {
  tenantId: string;
  provider: NotificationProvider;
  recipient: string;
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
  priority?: NotificationPriority;
  createdById?: string;
}

export interface SendNotificationOutput {
  success: boolean;
  notification?: Notification;
  error?: string;
}

export class SendNotificationUseCase {
  constructor(
    private readonly repository: INotificationRepository,
    private readonly providers: INotificationProvider[]
  ) {}

  async execute(input: SendNotificationInput): Promise<SendNotificationOutput> {
    try {
      // 1. Persistir intención en DB
      const notification = await this.repository.create({
        tenantId: input.tenantId,
        provider: input.provider,
        recipient: input.recipient,
        subject: input.subject,
        body: input.body,
        metadata: input.metadata,
        priority: input.priority,
        createdById: input.createdById,
      });

      // 2. Buscar el proveedor correcto
      const provider = this.providers.find((p) => p.supports(input.provider));

      if (!provider) {
        await this.repository.updateStatus(
          notification.id,
          "FAILED",
          "Proveedor no soportado"
        );
        return {
          success: false,
          error: "Proveedor no encontrado",
          notification,
        };
      }

      // 3. Actualizar estado a SENDING
      await this.repository.updateStatus(notification.id, "SENDING");

      // 4. Intentar envío
      const result = await provider.send(notification);

      if (result.success) {
        const updated = await this.repository.updateStatus(
          notification.id,
          "SENT"
        );
        return { success: true, notification: updated || notification };
      } else {
        const updated = await this.repository.updateStatus(
          notification.id,
          "FAILED",
          result.error
        );
        return {
          success: false,
          error: result.error,
          notification: updated || notification,
        };
      }
    } catch (error) {
      console.error("Error in SendNotificationUseCase:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }
}
