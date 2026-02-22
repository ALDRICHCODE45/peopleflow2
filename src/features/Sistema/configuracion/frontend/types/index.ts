import type { LeadStatus } from "@features/Leads/frontend/types";

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
}
