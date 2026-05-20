"use client";

import { ScrollArea } from "@shadcn/scroll-area";
import { useRouter } from "next/navigation";
import { useInAppNotificationsQuery } from "../hooks/useInAppNotificationsQuery";
import { useMarkAllAsReadMutation } from "../hooks/useMarkAllAsReadMutation";
import { useMarkAsReadMutation } from "../hooks/useMarkAsReadMutation";
import type { InAppNotificationDTO } from "../types/inAppNotification.types";
import { NotificationItem } from "./NotificationItem";

export function NotificationPopover() {
  const router = useRouter();
  const { data, isLoading } = useInAppNotificationsQuery({ limit: 20 });
  const markAsReadMutation = useMarkAsReadMutation();
  const markAllAsReadMutation = useMarkAllAsReadMutation();

  const notifications = data?.items ?? [];
  const unreadCount = notifications.filter((item) => !item.readAt).length;

  const handleNotificationClick = async (
    notification: InAppNotificationDTO,
  ) => {
    if (!notification.readAt) {
      await markAsReadMutation.mutateAsync({ id: notification.id });
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <div className="w-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Notificaciones
          </h3>
          {unreadCount > 0 ? (
            <span className="text-xs font-medium text-muted-foreground">
              {unreadCount} sin leer
            </span>
          ) : null}
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            Marcar todas como leídas
          </button>
        ) : null}
      </div>

      <div className="h-px bg-border/60" aria-hidden />

      {/* Body */}
      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center">
          <p className="text-xs text-muted-foreground">Cargando…</p>
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollArea className="h-[420px]">
          <ul className="py-1">
            {notifications.map((notification, index) => (
              <li
                key={notification.id}
                className={
                  index < notifications.length - 1
                    ? "border-b border-border/40"
                    : undefined
                }
              >
                <div className="px-1">
                  <NotificationItem
                    notification={notification}
                    onClick={handleNotificationClick}
                  />
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[200px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-2 size-10 rounded-full bg-muted/60" aria-hidden />
      <p className="text-sm font-medium text-foreground">Todo al día</p>
      <p className="mt-1 text-xs text-muted-foreground">
        No tiene notificaciones nuevas.
      </p>
    </div>
  );
}
