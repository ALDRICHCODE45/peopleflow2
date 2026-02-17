"use client";
import { Fragment } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@shadcn/dropdown-menu";
import { Button } from "@shadcn/button";
import { Ellipsis } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ContactActions } from "./createLeadContactActions";
import {
  EditContactFormData,
  LEAD_STATUS_OPTIONS,
  LeadStatus,
} from "../../types";

interface Props {
  actions: ContactActions[];
  onTagEdit: (data: EditContactFormData) => Promise<void>;
}

export function LeadContactActionsDropdown({ actions, onTagEdit }: Props) {
  const handleEditTag = async (tag: LeadStatus) => {
    const formData = {
      tag,
    };
    await onTagEdit(formData);
  };

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
          <Fragment key={action.id}>
            {action.variant === "destructive" && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={action.onClick}
              variant={
                action.variant === "destructive" ? "destructive" : "default"
              }
            >
              {action.icon && <HugeiconsIcon icon={action.icon} />}
              {action.label}
            </DropdownMenuItem>
          </Fragment>
        ))}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Etiqueta</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {LEAD_STATUS_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleEditTag(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
