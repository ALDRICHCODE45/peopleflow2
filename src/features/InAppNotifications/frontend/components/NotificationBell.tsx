"use client";

import { Notification03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@shadcn/button";
import { Popover, PopoverContent, PopoverTrigger } from "@shadcn/popover";
import { useState } from "react";
import { useUnreadCountQuery } from "../hooks/useUnreadCountQuery";
import { NotificationPopover } from "./NotificationPopover";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadCountQuery();
  const hasUnread = unreadCount > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            hasUnread
              ? `Abrir notificaciones (${unreadCount} sin leer)`
              : "Abrir notificaciones"
          }
          className="relative"
        >
          <HugeiconsIcon
            icon={Notification03Icon}
            className="size-5"
            strokeWidth={1.75}
          />
          {hasUnread ? (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold leading-none text-background ring-2 ring-background"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="overflow-hidden p-0 shadow-lg"
      >
        <NotificationPopover />
      </PopoverContent>
    </Popover>
  );
}
