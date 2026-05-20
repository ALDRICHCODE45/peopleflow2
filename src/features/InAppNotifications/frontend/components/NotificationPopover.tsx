"use client";

import { Button } from "@shadcn/button";
import { ScrollArea } from "@shadcn/scroll-area";
import { Separator } from "@shadcn/separator";
import { useRouter } from "next/navigation";
import { useInAppNotificationsQuery } from "../hooks/useInAppNotificationsQuery";
import { useMarkAllAsReadMutation } from "../hooks/useMarkAllAsReadMutation";
import { useMarkAsReadMutation } from "../hooks/useMarkAsReadMutation";
import type { InAppNotificationDTO } from "../types/inAppNotification.types";
import { NotificationItem } from "./NotificationItem";

export function NotificationPopover() {
  const router = useRouter();
  const { data } = useInAppNotificationsQuery({ limit: 20 });
  const markAsReadMutation = useMarkAsReadMutation();
  const markAllAsReadMutation = useMarkAllAsReadMutation();

  const notifications = data?.items ?? [];
  const unreadCount = notifications.filter((item) => !item.readAt).length;

  const handleNotificationClick = async (notification: InAppNotificationDTO) => {
    if (!notification.readAt) {
      await markAsReadMutation.mutateAsync({ id: notification.id });
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <div className="w-[360px]">
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-sm font-semibold">Notificaciones</h3>
        {unreadCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
          >
            Marcar todas como leídas
          </Button>
        ) : null}
      </div>
      <Separator />
      {notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground p-4 text-center">
          No tiene notificaciones nuevas
        </p>
      ) : (
        <ScrollArea className="h-[360px] p-2">
          <div className="space-y-1">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={handleNotificationClick}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
