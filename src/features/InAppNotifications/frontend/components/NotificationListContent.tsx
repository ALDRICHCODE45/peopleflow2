"use client";

import { Notification03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@shadcn/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@shadcn/empty";
import { ScrollArea } from "@shadcn/scroll-area";
import { Separator } from "@shadcn/separator";
import { cn } from "@lib/utils";
import { useRouter } from "next/navigation";
import { useInAppNotificationsQuery } from "../hooks/useInAppNotificationsQuery";
import { useMarkAllAsReadMutation } from "../hooks/useMarkAllAsReadMutation";
import { useMarkAsReadMutation } from "../hooks/useMarkAsReadMutation";
import type { InAppNotificationDTO } from "../types/inAppNotification.types";
import { NotificationItem } from "./NotificationItem";

interface NotificationListContentProps {
  variant: "popover" | "sheet";
}

export function NotificationListContent({ variant }: NotificationListContentProps) {
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
    <div className="bg-popover">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Notificaciones</h3>
          {unreadCount > 0 ? (
            <span className="text-xs text-muted-foreground">
              {unreadCount} sin leer
            </span>
          ) : null}
        </div>
        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            Marcar todas
          </Button>
        ) : null}
      </div>
      <Separator />

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <span className="text-xs text-muted-foreground">Cargando…</span>
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollArea
          className={cn(
            variant === "popover" ? "max-h-[min(70vh,480px)]" : "max-h-[60vh]",
          )}
        >
          <ul>
            {notifications.map((notification, index) => (
              <li
                key={notification.id}
              >
                <NotificationItem
                  notification={notification}
                  onClick={handleNotificationClick}
                />
                {index < notifications.length - 1 ? <Separator /> : null}
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
    <div className="px-4 py-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Notification03Icon} />
          </EmptyMedia>
          <EmptyTitle>Todo al día</EmptyTitle>
          <EmptyDescription>No tiene notificaciones nuevas.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
