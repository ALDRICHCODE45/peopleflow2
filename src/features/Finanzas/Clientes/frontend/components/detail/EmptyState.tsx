"use client";

import { Button } from "@/core/shared/ui/shadcn/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/core/shared/ui/shadcn/empty";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import { motion } from "motion/react";

interface EmptyStateProps {
  icon: IconSvgElement;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Empty className="border-0 py-8">
        <EmptyHeader>
          <EmptyMedia>
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/8 dark:bg-primary/15">
              <HugeiconsIcon
                icon={icon}
                className="size-6 text-primary/70 dark:text-primary/80"
                strokeWidth={1.5}
              />
            </div>
          </EmptyMedia>
          <EmptyTitle className="font-semibold text-foreground/90">
            {title}
          </EmptyTitle>
          {description && (
            <EmptyDescription className="text-muted-foreground/70">
              {description}
            </EmptyDescription>
          )}
        </EmptyHeader>
        {action && (
          <EmptyContent>
            <Button
              variant="outline"
              size="sm"
              onClick={action.onClick}
              className="mt-1"
            >
              {action.label}
            </Button>
          </EmptyContent>
        )}
      </Empty>
    </motion.div>
  );
}
