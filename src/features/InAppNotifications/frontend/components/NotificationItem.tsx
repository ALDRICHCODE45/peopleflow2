"use client";

import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@shadcn/avatar";
import { cn } from "@lib/utils";
import type { InAppNotificationDTO } from "../types/inAppNotification.types";
import { formatRelativeNotificationTime } from "../utils/formatRelativeNotificationTime";
import { NotificationTypeIcon, TONE_CLASSES, TYPE_CONFIG } from "./NotificationTypeIcon";

interface NotificationItemProps {
  notification: InAppNotificationDTO;
  onClick: (notification: InAppNotificationDTO) => void;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const isUnread = !notification.readAt;
  const hasTriggeredByActor =
    !!notification.triggeredBy &&
    (!!notification.triggeredBy.avatar || !!notification.triggeredBy.name);
  const typeConfig = TYPE_CONFIG[notification.type];
  const toneClass = TONE_CLASSES[typeConfig.tone];

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className="group relative flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      {hasTriggeredByActor && notification.triggeredBy ? (
        <Avatar size="default">
          <AvatarImage
            src={notification.triggeredBy.avatar ?? undefined}
            alt={notification.triggeredBy.name ?? ""}
          />
          <AvatarFallback>
            {notification.triggeredBy.name
              ? getInitials(notification.triggeredBy.name)
              : notification.triggeredBy.id[0]?.toUpperCase() ?? "?"}
          </AvatarFallback>
          <AvatarBadge
            aria-label={typeConfig.label}
            className={cn(
              "border-2 border-background [&>svg]:hidden",
              toneClass,
            )}
          />
        </Avatar>
      ) : (
        <NotificationTypeIcon type={notification.type} />
      )}

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
