export type InAppNotificationType =
  | "VACANCY_ATTACHMENT_REJECTED"
  | "VACANCY_CHECKLIST_REJECTED"
  | "TERNA_VALIDATION_PENDING"
  | "VACANCY_ASSIGNED"
  | "LEAD_STATUS_CHANGED"
  | "LEAD_INACTIVE"
  | "VACANCY_STALE"
  | "VACANCY_COUNTDOWN"
  | "COMMITMENT_MORNING_REMINDER"
  | "COMMITMENT_EVENING_ADMIN_REPORT";

export interface TriggeredByActorDTO {
  id: string;
  name: string | null;
  image: string | null;
}

export interface InAppNotificationDTO {
  id: string;
  tenantId: string;
  userId: string;
  type: InAppNotificationType;
  title: string;
  body: string;
  resourceType: string | null;
  resourceId: string | null;
  actionUrl: string | null;
  readAt: string | null;
  archivedAt: string | null;
  triggeredByUserId: string | null;
  triggeredBy: TriggeredByActorDTO | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ListInAppNotificationsResult {
  error: string | null;
  data?: {
    items: InAppNotificationDTO[];
    nextCursor: string | null;
  };
}

export interface GetUnreadInAppNotificationCountResult {
  error: string | null;
  data?: { count: number };
}

export interface MarkInAppNotificationAsReadResult {
  error: string | null;
  data?: { success: true };
}

export interface MarkAllInAppNotificationsAsReadResult {
  error: string | null;
  data?: { count: number };
}
