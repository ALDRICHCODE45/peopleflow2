"use client";

import type { InAppNotificationDTO } from "../types/inAppNotification.types";
import { formatRelativeNotificationTime } from "../utils/formatRelativeNotificationTime";
import { NotificationTypeIcon } from "./NotificationTypeIcon";

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
      className="group relative flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <NotificationTypeIcon type={notification.type} />

      <div className="min-w-0 flex-1 pr-4">
        <p
          className={`text-sm leading-snug text-foreground ${
            isUnread ? "font-semibold" : "font-medium"
          }`}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {notification.body}
        </p>
        <p className="mt-1.5 text-[11px] font-medium text-muted-foreground/80">
          {formatRelativeNotificationTime(notification.createdAt)}
        </p>
      </div>

      {isUnread ? (
        <span
          aria-hidden
          className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
        />
      ) : null}
    </button>
  );
}
