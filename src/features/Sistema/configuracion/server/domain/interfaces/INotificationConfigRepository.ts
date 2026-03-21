import type { NotificationConfig } from "../entities/NotificationConfig";
import type { LeadStatus } from "@features/Leads/frontend/types";
import type { VacancyStatusType } from "@features/vacancy/frontend/types/vacancy.types";

export interface UpsertNotificationConfigData {
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

export interface INotificationConfigRepository {
  findByTenantId(tenantId: string): Promise<NotificationConfig | null>;
  upsert(data: UpsertNotificationConfigData): Promise<NotificationConfig>;
}
