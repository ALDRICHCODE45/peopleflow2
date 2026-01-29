import type {
  Notification,
  NotificationProvider,
} from "../entities/Notification";

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface INotificationProvider {
  supports(provider: NotificationProvider): boolean;
  send(notification: Notification): Promise<SendResult>;
}
