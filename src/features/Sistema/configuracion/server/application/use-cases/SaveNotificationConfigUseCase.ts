import type { INotificationConfigRepository } from "../../domain/interfaces/INotificationConfigRepository";
import type { NotificationConfigDTO } from "../../domain/entities/NotificationConfig";
import type { LeadStatus } from "@features/Leads/frontend/types";
import type { VacancyStatusType } from "@features/vacancy/frontend/types/vacancy.types";

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
  // Vacancy countdown
  vacancyCountdownEnabled: boolean;
  vacancyCountdownDaysBefore: number[];
  // Vacancy stale
  vacancyStaleEnabled: boolean;
  vacancyStaleStatuses: VacancyStatusType[];
  vacancyStaleTimeValue: number;
  vacancyStaleTimeUnit: "HOURS" | "DAYS";
  vacancyStaleRepeatValue: number;
  vacancyStaleRepeatUnit: "HOURS" | "DAYS";
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

      if (input.vacancyStaleTimeValue <= 0) {
        return {
          success: false,
          error: "El tiempo de inactividad de vacante debe ser mayor a 0",
        };
      }

      if (input.vacancyStaleRepeatValue <= 0) {
        return {
          success: false,
          error: "El intervalo de repetición debe ser mayor a 0",
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
        vacancyCountdownEnabled: input.vacancyCountdownEnabled,
        vacancyCountdownDaysBefore: input.vacancyCountdownDaysBefore,
        vacancyStaleEnabled: input.vacancyStaleEnabled,
        vacancyStaleStatuses: input.vacancyStaleStatuses,
        vacancyStaleTimeValue: input.vacancyStaleTimeValue,
        vacancyStaleTimeUnit: input.vacancyStaleTimeUnit,
        vacancyStaleRepeatValue: input.vacancyStaleRepeatValue,
        vacancyStaleRepeatUnit: input.vacancyStaleRepeatUnit,
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
