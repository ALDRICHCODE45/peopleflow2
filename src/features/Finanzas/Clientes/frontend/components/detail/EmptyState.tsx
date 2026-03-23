"use client";

import { Button } from "@/core/shared/ui/shadcn/button";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="text-muted-foreground/40 mb-3">{icon}</div>
      <p className="text-sm text-muted-foreground font-medium">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground/60 mt-1 max-w-[240px]">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
