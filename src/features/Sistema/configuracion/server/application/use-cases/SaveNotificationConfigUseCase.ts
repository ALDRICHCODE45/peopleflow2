import type { INotificationConfigRepository } from "../../domain/interfaces/INotificationConfigRepository";
import type { NotificationConfigDTO } from "../../domain/entities/NotificationConfig";
import type { LeadStatus } from "@features/Leads/frontend/types";

export interface SaveNotificationConfigInput {
  tenantId: string;
  enabled: boolean;
  recipientUserIds: string[];
  leadStatusChangeEnabled: boolean;
  leadStatusChangeTriggers: LeadStatus[];
  leadInactiveEnabled: boolean;
  leadInactiveStatuses: LeadStatus[];
  leadInactiveTimeValue: number;
  leadInactiveTimeUnit: "HOURS" | "DAYS";
}

export interface SaveNotificationConfigOutput {
  success: boolean;
  config?: NotificationConfigDTO;
  error?: string;
}

export class SaveNotificationConfigUseCase {
  constructor(
    private readonly repository: INotificationConfigRepository,
  ) {}

  async execute(
    input: SaveNotificationConfigInput,
  ): Promise<SaveNotificationConfigOutput> {
    try {
      if (input.leadInactiveTimeValue <= 0) {
        return {
          success: false,
          error: "El tiempo de inactividad debe ser mayor a 0",
        };
      }

      const config = await this.repository.upsert({
        tenantId: input.tenantId,
        enabled: input.enabled,
        recipientUserIds: input.recipientUserIds,
        leadStatusChangeEnabled: input.leadStatusChangeEnabled,
        leadStatusChangeTriggers: input.leadStatusChangeTriggers,
        leadInactiveEnabled: input.leadInactiveEnabled,
        leadInactiveStatuses: input.leadInactiveStatuses,
        leadInactiveTimeValue: input.leadInactiveTimeValue,
        leadInactiveTimeUnit: input.leadInactiveTimeUnit,
      });

      return { success: true, config: config.toJSON() };
    } catch (error) {
      console.error("Error in SaveNotificationConfigUseCase:", error);
      return {
        success: false,
        error: "Error al guardar la configuración de notificaciones",
      };
    }
  }
}
