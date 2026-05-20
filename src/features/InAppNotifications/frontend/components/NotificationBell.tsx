"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@shadcn/popover";
import { Button } from "@shadcn/button";
import { Badge } from "@shadcn/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification03Icon } from "@hugeicons/core-free-icons";
import { useUnreadCountQuery } from "../hooks/useUnreadCountQuery";
import { NotificationPopover } from "./NotificationPopover";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadCountQuery();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir notificaciones">
          <span className="relative inline-flex">
            <HugeiconsIcon icon={Notification03Icon} className="size-5" />
            {unreadCount > 0 ? (
              <Badge className="absolute -top-2 -right-2 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            ) : null}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0">
        <NotificationPopover />
      </PopoverContent>
    </Popover>
  );
}
