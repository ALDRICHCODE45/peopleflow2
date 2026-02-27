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
import { Ellipsis } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export interface CandidateAction {
  id: string;
  label: string;
  variant?: "default" | "destructive";
  onClick: () => void;
}

interface CandidateActionsDropdownProps {
  actions: CandidateAction[];
}

export function CandidateActionsDropdown({
  actions,
}: CandidateActionsDropdownProps) {
  const normalActions = actions.filter((a) => a.variant !== "destructive");
  const destructiveActions = actions.filter((a) => a.variant === "destructive");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <HugeiconsIcon icon={Ellipsis} className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {normalActions.map((action) => (
          <DropdownMenuItem key={action.id} onClick={action.onClick}>
            {action.label}
          </DropdownMenuItem>
        ))}

        {destructiveActions.map((action) => (
          <Fragment key={action.id}>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={action.onClick}
            >
              {action.label}
            </DropdownMenuItem>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
