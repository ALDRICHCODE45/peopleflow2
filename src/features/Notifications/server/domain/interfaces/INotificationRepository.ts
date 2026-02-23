import type {
  Notification,
  NotificationProvider,
  NotificationPriority,
  NotificationStatus,
} from "../entities/Notification";

export interface CreateNotificationData {
  tenantId: string;
  provider: NotificationProvider;
  recipient: string;
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  createdById?: string;
}

export interface INotificationRepository {
  create(data: CreateNotificationData): Promise<Notification>;
  findById(id: string, tenantId: string): Promise<Notification | null>;
  updateStatus(
    id: string,
    status: NotificationStatus,
    error?: string
  ): Promise<Notification | null>;
  findPending(tenantId?: string): Promise<Notification[]>;
  findByTenant(
    tenantId: string,
    options?: {
      status?: NotificationStatus;
      provider?: NotificationProvider;
      limit?: number;
      offset?: number;
    }
  ): Promise<Notification[]>;
}
