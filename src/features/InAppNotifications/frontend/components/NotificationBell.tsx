"use client";

import { Notification03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useIsMobile } from "@core/shared/hooks/use-mobile";
import { Badge } from "@shadcn/badge";
import { Button } from "@shadcn/button";
import { Popover, PopoverContent, PopoverTrigger } from "@shadcn/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@shadcn/sheet";
import { useState } from "react";
import { useUnreadCountQuery } from "../hooks/useUnreadCountQuery";
import { NotificationListContent } from "./NotificationListContent";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const { data: unreadCount = 0 } = useUnreadCountQuery();
  const hasUnread = unreadCount > 0;
  const unreadCountDisplay = unreadCount > 99 ? "99+" : unreadCount;

  const trigger = (
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
      <HugeiconsIcon icon={Notification03Icon} strokeWidth={1.75} />
      {hasUnread ? (
        <Badge
          aria-hidden
          variant="default"
          className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-xs leading-none"
        >
          {unreadCountDisplay}
        </Badge>
      ) : null}
    </Button>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="bottom" className="p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Notificaciones</SheetTitle>
          </SheetHeader>
          <NotificationListContent variant="sheet" />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        className="w-[420px] overflow-hidden p-0"
      >
        <NotificationListContent variant="popover" />
      </PopoverContent>
    </Popover>
  );
}
