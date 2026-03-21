import type { LeadStatus } from "@features/Leads/frontend/types";
import type { VacancyStatusType } from "@features/vacancy/frontend/types/vacancy.types";

export interface NotificationConfigDTO {
  id: string;
  tenantId: string;
  enabled: boolean;
  recipientUserIds: string[];
  leadStatusChangeEnabled: boolean;
  leadStatusChangeTriggers: LeadStatus[];
  leadInactiveEnabled: boolean;
  leadInactiveStatuses: LeadStatus[];
  leadInactiveTimeValue: number;
  leadInactiveTimeUnit: "HOURS" | "DAYS";
  vacancyCountdownEnabled: boolean;
  vacancyCountdownDaysBefore: number[];
  vacancyStaleEnabled: boolean;
  vacancyStaleStatuses: VacancyStatusType[];
  vacancyStaleTimeValue: number;
  vacancyStaleTimeUnit: "HOURS" | "DAYS";
  vacancyStaleRepeatValue: number;
  vacancyStaleRepeatUnit: "HOURS" | "DAYS";
}

export interface SaveNotificationConfigData {
  enabled: boolean;
  recipientUserIds: string[];
  leadStatusChangeEnabled: boolean;
  leadStatusChangeTriggers: LeadStatus[];
  leadInactiveEnabled: boolean;
  leadInactiveStatuses: LeadStatus[];
  leadInactiveTimeValue: number;
  leadInactiveTimeUnit: "HOURS" | "DAYS";
  vacancyCountdownEnabled: boolean;
  vacancyCountdownDaysBefore: number[];
  vacancyStaleEnabled: boolean;
  vacancyStaleStatuses: VacancyStatusType[];
  vacancyStaleTimeValue: number;
  vacancyStaleTimeUnit: "HOURS" | "DAYS";
  vacancyStaleRepeatValue: number;
  vacancyStaleRepeatUnit: "HOURS" | "DAYS";
}
