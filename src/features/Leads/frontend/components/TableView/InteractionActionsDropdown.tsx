"use client";

import { Fragment } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@shadcn/dropdown-menu";
import { Button } from "@shadcn/button";
import { MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { InteractionAction } from "./createInteractionActions";

interface Props {
  actions: InteractionAction[];
  disabled?: boolean;
}

export function InteractionActionsDropdown({ actions, disabled }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={disabled}
        >
          <HugeiconsIcon icon={MoreVerticalIcon} className="h-4 w-4" />
          <span className="sr-only">Acciones de interacción</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((action) => (
          <Fragment key={action.id}>
            {action.variant === "destructive" && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={action.onClick}
              variant={
                action.variant === "destructive" ? "destructive" : "default"
              }
            >
              {action.icon && (
                <HugeiconsIcon icon={action.icon} className="mr-2 h-4 w-4" />
              )}
              {action.label}
            </DropdownMenuItem>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
