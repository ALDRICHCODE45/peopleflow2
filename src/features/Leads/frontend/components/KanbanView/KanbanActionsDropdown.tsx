"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@shadcn/dropdown-menu";
import { Button } from "@shadcn/button";
import { Ellipsis } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { LeadKanbanAction } from "./helpers/createKanbanActions";

interface Props {
  actions: LeadKanbanAction[];
}

export function LeadKanbanActionsDropdown({ actions }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
          <HugeiconsIcon icon={Ellipsis} className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((action) => (
          <>
            {action.variant === "destructive" && <DropdownMenuSeparator />}
            <DropdownMenuItem
              key={action.id}
              onClick={action.onClick}
              variant={
                action.variant === "destructive" ? "destructive" : "default"
              }
            >
              {action.icon && <HugeiconsIcon icon={action.icon} />}
              {action.label}
            </DropdownMenuItem>
          </>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
