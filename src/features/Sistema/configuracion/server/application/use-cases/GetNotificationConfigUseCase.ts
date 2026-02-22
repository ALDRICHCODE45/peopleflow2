import type { INotificationConfigRepository } from "../../domain/interfaces/INotificationConfigRepository";
import type { NotificationConfigDTO } from "../../domain/entities/NotificationConfig";

export interface GetNotificationConfigInput {
  tenantId: string;
}

export interface GetNotificationConfigOutput {
  success: boolean;
  config?: NotificationConfigDTO;
  error?: string;
}

export class GetNotificationConfigUseCase {
  constructor(
    private readonly repository: INotificationConfigRepository,
  ) {}

  async execute(
    input: GetNotificationConfigInput,
  ): Promise<GetNotificationConfigOutput> {
    try {
      const config = await this.repository.findByTenantId(input.tenantId);

      if (!config) {
        return { success: true, config: undefined };
      }

      return { success: true, config: config.toJSON() };
    } catch (error) {
      console.error("Error in GetNotificationConfigUseCase:", error);
      return {
        success: false,
        error: "Error al obtener la configuración de notificaciones",
      };
    }
  }
}
