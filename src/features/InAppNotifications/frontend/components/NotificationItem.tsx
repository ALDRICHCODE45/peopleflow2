"use client";

import type { InAppNotificationDTO } from "../types/inAppNotification.types";
import { formatRelativeNotificationTime } from "../utils/formatRelativeNotificationTime";

interface NotificationItemProps {
  notification: InAppNotificationDTO;
  onClick: (notification: InAppNotificationDTO) => void;
}

export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const isUnread = !notification.readAt;

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors"
    >
      <div className="flex gap-2">
        <div className="w-2 h-2 mt-1.5 shrink-0">
          {isUnread ? (
            <span
              aria-hidden
              className="block w-2 h-2 rounded-full bg-primary"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{notification.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {notification.body}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatRelativeNotificationTime(notification.createdAt)}
          </p>
        </div>
      </div>
    </button>
  );
}
