import type {
  InAppNotification,
  InAppNotificationType,
} from "../entities/InAppNotification";

export interface CreateInAppNotificationData {
  tenantId: string;
  userId: string;
  type: InAppNotificationType;
  title: string;
  body: string;
  resourceType?: string;
  resourceId?: string;
  actionUrl?: string;
  triggeredByUserId?: string;
  metadata?: Record<string, unknown>;
}

export interface ListInAppNotificationsInput {
  tenantId: string;
  userId: string;
  unreadOnly?: boolean;
  limit: number;
  cursor?: string;
}

export interface ListInAppNotificationsOutput {
  items: InAppNotification[];
  nextCursor: string | null;
}

export interface IInAppNotificationRepository {
  create(data: CreateInAppNotificationData): Promise<InAppNotification>;
  listForUser(input: ListInAppNotificationsInput): Promise<ListInAppNotificationsOutput>;
  getUnreadCount(input: { tenantId: string; userId: string }): Promise<number>;
  markAsRead(input: { id: string; tenantId: string; userId: string }): Promise<void>;
  markAllAsRead(input: { tenantId: string; userId: string }): Promise<number>;
}
