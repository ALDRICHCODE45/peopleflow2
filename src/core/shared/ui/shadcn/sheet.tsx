"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";

import { Button } from "@core/shared/ui/shadcn/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/core/lib/utils";

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/10 duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 z-50",
        className
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  width = "default",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
  width?: "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "default" | string;
}) {
  const widthClasses = {
    sm: "w-64",
    md: "w-96",
    lg: "w-[32rem]",
    xl: "w-[40rem]",
    "2xl": "w-[48rem]",
    full: "w-full",
    default: "w-3/4",
  };

  const getWidthClass = () => {
    if (side === "left") {
      return {
        "data-[side=left]:w-64": width === "sm",
        "data-[side=left]:w-96": width === "md",
        "data-[side=left]:w-[32rem]": width === "lg",
        "data-[side=left]:w-[40rem]": width === "xl",
        "data-[side=left]:w-[48rem]": width === "2xl",
        "data-[side=left]:w-full": width === "full",
        "data-[side=left]:w-3/4": width === "default",
      };
    } else if (side === "right") {
      return {
        "data-[side=right]:w-64": width === "sm",
        "data-[side=right]:w-96": width === "md",
        "data-[side=right]:w-[32rem]": width === "lg",
        "data-[side=right]:w-[40rem]": width === "xl",
        "data-[side=right]:w-[48rem]": width === "2xl",
        "data-[side=right]:w-full": width === "full",
        "data-[side=right]:w-3/4": width === "default",
      };
    }
    return {};
  };

  const widthClassMap = getWidthClass();
  const customWidthStyle =
    width && !(width in widthClasses) && (side === "left" || side === "right")
      ? { width: width }
      : undefined;

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        style={customWidthStyle}
        className={cn(
          "bg-background data-open:animate-in data-closed:animate-out data-[side=right]:data-closed:slide-out-to-right-10 data-[side=right]:data-open:slide-in-from-right-10 data-[side=left]:data-closed:slide-out-to-left-10 data-[side=left]:data-open:slide-in-from-left-10 data-[side=top]:data-closed:slide-out-to-top-10 data-[side=top]:data-open:slide-in-from-top-10 data-closed:fade-out-0 data-open:fade-in-0 data-[side=bottom]:data-closed:slide-out-to-bottom-10 data-[side=bottom]:data-open:slide-in-from-bottom-10 fixed z-50 flex flex-col gap-4 bg-clip-padding text-sm shadow-lg transition duration-500 ease-out",
          // Bottom side styles - max height 70% of viewport for mobile sheets
          "data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:max-h-[70vh] data-[side=bottom]:border-t data-[side=bottom]:overflow-y-auto",
          // Left side styles with margins
          "data-[side=left]:top-8 data-[side=left]:bottom-8 data-[side=left]:left-0 data-[side=left]:h-[calc(100vh-4rem)] data-[side=left]:border-r",
          // Right side styles with margins
          "data-[side=right]:top-8 data-[side=right]:bottom-8 data-[side=right]:right-0 data-[side=right]:h-[calc(100vh-4rem)] data-[side=right]:border-l",
          // Top side styles
          "data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b",
          // Width classes for left and right sides
          widthClassMap,
          // Max width for small screens (only for default width)
          width === "default" &&
            "data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close data-slot="sheet-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-3 right-3"
              size="icon-sm"
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              <span className="sr-only">Close</span>
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("gap-0.5 p-4 flex flex-col", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("gap-2 p-4 mt-auto flex flex-col", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground text-base font-medium", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
