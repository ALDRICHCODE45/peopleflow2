"use client";
import { useId } from "react";
import { Label } from "@shadcn/label";
import { Switch } from "@shadcn/switch";

interface SwitchActionNotificationProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children?: React.ReactNode;
}

export function SwitchActionNotification({
  label,
  description,
  checked,
  onCheckedChange,
  children,
}: SwitchActionNotificationProps) {
  const id = useId();

  return (
    <div className="rounded-md border px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <Label htmlFor={id} className="text-sm font-medium">
            {label}
          </Label>
          {description && (
            <p
              className="text-muted-foreground text-xs"
              id={`${id}-description`}
            >
              {description}
            </p>
          )}
        </div>
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          aria-describedby={description ? `${id}-description` : undefined}
        />
      </div>
      {children}
    </div>
  );
}
