"use client";
import { memo, useId } from "react";
import { Label } from "@shadcn/label";
import { Switch } from "@shadcn/switch";

interface SwitchActionNotificationProps {
  actionId: string;
  label: string;
  description?: string;
  checked: boolean;
  onToggle: (actionId: string, checked: boolean) => void;
  children?: React.ReactNode;
}

export const SwitchActionNotification = memo(function SwitchActionNotification({
  actionId,
  label,
  description,
  checked,
  onToggle,
  children,
}: SwitchActionNotificationProps) {
  const id = useId();

  const handleCheckedChange = (value: boolean) => {
    onToggle(actionId, value);
  };

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
          onCheckedChange={handleCheckedChange}
          aria-describedby={description ? `${id}-description` : undefined}
        />
      </div>
      {children}
    </div>
  );
});
