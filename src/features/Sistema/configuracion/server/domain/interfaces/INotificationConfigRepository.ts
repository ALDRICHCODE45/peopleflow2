import type { NotificationConfig } from "../entities/NotificationConfig";
import type { LeadStatus } from "@features/Leads/frontend/types";

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
}

export interface INotificationConfigRepository {
  findByTenantId(tenantId: string): Promise<NotificationConfig | null>;
  upsert(data: UpsertNotificationConfigData): Promise<NotificationConfig>;
}
