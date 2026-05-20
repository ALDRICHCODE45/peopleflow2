"use client";

import { cn } from "@lib/utils";
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

      <div className="min-w-0 flex-1 pr-2">
        <p
          className={cn(
            "line-clamp-2 text-sm leading-snug text-foreground",
            isUnread && "font-semibold",
          )}
        >
          {notification.title}
          {isUnread ? (
            <span
              aria-hidden
              className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle"
            />
          ) : null}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {notification.body}
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {formatRelativeNotificationTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}
