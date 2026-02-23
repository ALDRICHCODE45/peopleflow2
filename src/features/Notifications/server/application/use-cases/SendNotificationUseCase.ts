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
      // 1. Verificar proveedor ANTES de persistir (fail-fast)
      const provider = this.providers.find((p) => p.supports(input.provider));

      if (!provider) {
        const notification = await this.repository.create({
          tenantId: input.tenantId,
          provider: input.provider,
          recipient: input.recipient,
          subject: input.subject,
          body: input.body,
          metadata: input.metadata,
          priority: input.priority,
          status: "FAILED",
          createdById: input.createdById,
        });
        return {
          success: false,
          error: "Proveedor no encontrado",
          notification,
        };
      }

      // 2. Crear con status SENDING directamente (1 INSERT en vez de INSERT + UPDATE)
      const notification = await this.repository.create({
        tenantId: input.tenantId,
        provider: input.provider,
        recipient: input.recipient,
        subject: input.subject,
        body: input.body,
        metadata: input.metadata,
        priority: input.priority,
        status: "SENDING",
        createdById: input.createdById,
      });

      // 3. Intentar envío
      const result = await provider.send(notification);

      // 4. Actualizar estado final (1 UPDATE)
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
