"use client";

import { memo, useMemo } from "react";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { Note03Icon } from "@hugeicons/core-free-icons";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/core/lib/utils";
import type { Interaction } from "../../types";
import { INTERACTION_TYPE_LABELS, INTERACTION_ICONS } from "../../types";
import { InteractionActionsDropdown } from "./InteractionActionsDropdown";
import { createInteractionActions } from "./createInteractionActions";

interface InteractionItemProps {
  interaction: Interaction;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export const InteractionItem = memo(function InteractionItem({
  interaction,
  onEdit,
  onDelete,
  disabled,
}: InteractionItemProps) {
  const IconComponent = INTERACTION_ICONS[interaction.type] || Note03Icon;

  const formattedDate = useMemo(
    () =>
      format(new Date(interaction.date), "d MMM yyyy, HH:mm", {
        locale: es,
      }),
    [interaction.date]
  );

  const actions = useMemo(
    () =>
      createInteractionActions({
        onEdit,
        onDelete,
      }),
    [onEdit, onDelete]
  );

  return (
    <div
      className={cn(
        "rounded-lg border border-border/40 p-3",
        "bg-gradient-to-b from-background to-muted/20",
        "group"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 size-8 rounded-full bg-primary/10 flex items-center justify-center">
          <HugeiconsIcon icon={IconComponent} className="size-4 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {INTERACTION_TYPE_LABELS[interaction.type]}
            </Badge>
            <span className="text-xs text-muted-foreground">{formattedDate}</span>
          </div>

          <h4 className="font-medium text-sm">{interaction.subject}</h4>

          {interaction.content && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {interaction.content}
            </p>
          )}

          {interaction.createdByName && (
            <p className="text-xs text-muted-foreground/80 pt-1">
              Por {interaction.createdByName}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <InteractionActionsDropdown actions={actions} disabled={disabled} />
        </div>
      </div>
    </div>
  );
});
