import type { LeadStatus } from "@features/Leads/frontend/types";
import type { VacancyStatusType } from "@features/vacancy/frontend/types/vacancy.types";

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
  get vacancyCountdownEnabled() {
    return this.props.vacancyCountdownEnabled;
  }
  get vacancyCountdownDaysBefore() {
    return this.props.vacancyCountdownDaysBefore;
  }
  get vacancyStaleEnabled() {
    return this.props.vacancyStaleEnabled;
  }
  get vacancyStaleStatuses() {
    return this.props.vacancyStaleStatuses;
  }
  get vacancyStaleTimeValue() {
    return this.props.vacancyStaleTimeValue;
  }
  get vacancyStaleTimeUnit() {
    return this.props.vacancyStaleTimeUnit;
  }
  get vacancyStaleRepeatValue() {
    return this.props.vacancyStaleRepeatValue;
  }
  get vacancyStaleRepeatUnit() {
    return this.props.vacancyStaleRepeatUnit;
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

  /** Whether countdown reminders before targetDeliveryDate are active */
  shouldNotifyOnCountdown(): boolean {
    return this.enabled && this.vacancyCountdownEnabled;
  }

  /** Returns countdown days sorted descending (e.g. [7, 3, 1]) */
  getCountdownDaysBefore(): number[] {
    return [...this.vacancyCountdownDaysBefore].sort((a, b) => b - a);
  }

  /** Whether stale vacancy monitoring is active */
  shouldMonitorStaleVacancies(): boolean {
    return this.enabled && this.vacancyStaleEnabled;
  }

  /** Inngest-compatible sleep duration for stale threshold, e.g. "72h" or "3d" */
  getStaleSleepDuration(): string {
    const suffix = this.vacancyStaleTimeUnit === "HOURS" ? "h" : "d";
    return `${this.vacancyStaleTimeValue}${suffix}`;
  }

  /** Inngest-compatible sleep duration for stale repeat interval */
  getStaleRepeatDuration(): string {
    const suffix = this.vacancyStaleRepeatUnit === "HOURS" ? "h" : "d";
    return `${this.vacancyStaleRepeatValue}${suffix}`;
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
      vacancyCountdownEnabled: this.props.vacancyCountdownEnabled,
      vacancyCountdownDaysBefore: this.props.vacancyCountdownDaysBefore,
      vacancyStaleEnabled: this.props.vacancyStaleEnabled,
      vacancyStaleStatuses: this.props.vacancyStaleStatuses,
      vacancyStaleTimeValue: this.props.vacancyStaleTimeValue,
      vacancyStaleTimeUnit: this.props.vacancyStaleTimeUnit,
      vacancyStaleRepeatValue: this.props.vacancyStaleRepeatValue,
      vacancyStaleRepeatUnit: this.props.vacancyStaleRepeatUnit,
    };
  }
}
