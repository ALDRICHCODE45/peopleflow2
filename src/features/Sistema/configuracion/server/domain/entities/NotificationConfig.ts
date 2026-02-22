import type { LeadStatus } from "@features/Leads/frontend/types";

export interface NotificationConfigProps {
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
  createdAt: Date;
  updatedAt: Date;
}

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

export class NotificationConfig {
  constructor(private readonly props: NotificationConfigProps) {}

  get id() {
    return this.props.id;
  }
  get tenantId() {
    return this.props.tenantId;
  }
  get enabled() {
    return this.props.enabled;
  }
  get recipientUserIds() {
    return this.props.recipientUserIds;
  }
  get leadStatusChangeEnabled() {
    return this.props.leadStatusChangeEnabled;
  }
  get leadStatusChangeTriggers() {
    return this.props.leadStatusChangeTriggers;
  }
  get leadInactiveEnabled() {
    return this.props.leadInactiveEnabled;
  }
  get leadInactiveStatuses() {
    return this.props.leadInactiveStatuses;
  }
  get leadInactiveTimeValue() {
    return this.props.leadInactiveTimeValue;
  }
  get leadInactiveTimeUnit() {
    return this.props.leadInactiveTimeUnit;
  }

  shouldNotifyOnStatusChange(status: LeadStatus): boolean {
    return (
      this.enabled &&
      this.leadStatusChangeEnabled &&
      this.leadStatusChangeTriggers.includes(status)
    );
  }

  shouldMonitorInactivity(status: LeadStatus): boolean {
    return (
      this.enabled &&
      this.leadInactiveEnabled &&
      this.leadInactiveStatuses.includes(status)
    );
  }

  /** Returns Inngest-compatible sleep duration string, e.g. "48h" or "3d" */
  getInactivitySleepDuration(): string {
    const suffix = this.leadInactiveTimeUnit === "HOURS" ? "h" : "d";
    return `${this.leadInactiveTimeValue}${suffix}`;
  }

  toJSON(): NotificationConfigDTO {
    return {
      id: this.props.id,
      tenantId: this.props.tenantId,
      enabled: this.props.enabled,
      recipientUserIds: this.props.recipientUserIds,
      leadStatusChangeEnabled: this.props.leadStatusChangeEnabled,
      leadStatusChangeTriggers: this.props.leadStatusChangeTriggers,
      leadInactiveEnabled: this.props.leadInactiveEnabled,
      leadInactiveStatuses: this.props.leadInactiveStatuses,
      leadInactiveTimeValue: this.props.leadInactiveTimeValue,
      leadInactiveTimeUnit: this.props.leadInactiveTimeUnit,
    };
  }
}
