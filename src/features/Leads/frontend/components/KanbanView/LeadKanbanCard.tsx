"use client";

import { memo, useMemo, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Lead } from "../../types";
import { LeadStatusBadge } from "../TableView/LeadStatusBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar, Document, Link, People } from "@hugeicons/core-free-icons";
import { Separator } from "@/core/shared/ui/shadcn/separator";
import { Avatar, AvatarFallback } from "@/core/shared/ui/shadcn/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/core/shared/ui/shadcn/tooltip";
import { getInitials } from "@/core/shared/helpers/getInitials";
import { useModalState } from "@/core/shared/hooks";
import { createKanbanActions } from "./helpers/createKanbanActions";
import { LeadKanbanActionsDropdown } from "./KanbanActionsDropdown";
import { LeadSheetForm } from "../TableView/LeadSheetForm";
import { DeleteLeadAlertDialog } from "../TableView/DeleteLeadAlertDialog";
import { useDeleteLead } from "../../hooks/useLeads";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { ReasignLeadDialog } from "./ReasignLeadDialog";

interface LeadKanbanCardProps {
  lead: Lead;
  onSelect: (lead: Lead) => void;
}

export const LeadKanbanCard = memo(function LeadKanbanCard({
  lead,
  onSelect,
}: LeadKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: { type: "lead", lead },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const {
    isOpen: isUpdateOpen,
    openModal: openUpdateModal,
    closeModal: closeUpdateModal,
  } = useModalState();

  const {
    isOpen: isDeleteOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModalState();

  const {
    isOpen: isReasignOpen,
    openModal: openReasignModal,
    closeModal: closeReasignModal,
  } = useModalState();

  const deleteLeadMutation = useDeleteLead();

  // Memoize date formatting to avoid expensive date-fns calculations on every render
  const formattedDate = useMemo(
    () => format(new Date(lead.createdAt), "dd MMM yyyy", { locale: es }),
    [lead.createdAt],
  );

  const handleDelete = useCallback(async () => {
    await deleteLeadMutation.mutateAsync(lead.id);
    closeDeleteModal();
  }, [lead.id, deleteLeadMutation, closeDeleteModal]);

  // Memoize kanban actions to prevent recreation on every render
  const kanbanActions = useMemo(
    () =>
      createKanbanActions({
        onEdit: openUpdateModal,
        onDelete: openDeleteModal,
        onReasingnar: openReasignModal,
      }),
    [openUpdateModal, openDeleteModal, openReasignModal],
  );

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setActivatorNodeRef(node);
      }}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(lead)}
      className="cursor-grab active:cursor-grabbing rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-all duration-200 group"
    >
      {/* Header: Status badge + menu */}
      <div className="flex items-center justify-between mb-3">
        <LeadStatusBadge status={lead.status} />
        <div onClick={(e) => e.stopPropagation()}>
          <LeadKanbanActionsDropdown actions={kanbanActions} />
        </div>
      </div>

      {/* Company name + avatar */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="font-semibold w-2/3 text-sm truncate text-foreground leading-snug">
          {lead.companyName}
        </h4>
        {lead.assignedToName && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="size-7 shrink-0 border border-border/50">
                <AvatarFallback className="text-[10px] font-medium bg-muted text-muted-foreground">
                  {getInitials(lead.assignedToName)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="top">{lead.assignedToName}</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Sector */}
      {lead.sectorName && (
        <p className="text-xs text-muted-foreground truncate mb-3">
          {lead.sectorName}
        </p>
      )}

      {/* Date row */}
      <div className="flex items-center gap-1.5 mb-3">
        <HugeiconsIcon
          icon={Calendar}
          className="text-muted-foreground/70"
          size={14}
        />
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
      </div>

      <Separator className="mb-3" />

      {/* Stats row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <HugeiconsIcon icon={People} className="text-primary/80" size={14} />
          <span className="text-xs font-medium text-primary/80">
            {lead.contactsCount ?? 0}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <HugeiconsIcon icon={Link} className="text-primary/80" size={14} />
          <span className="text-xs font-medium text-primary/80">0</span>
        </div>
        <div className="flex items-center gap-1.5">
          <HugeiconsIcon
            icon={Document}
            className="text-primary/80"
            size={14}
          />
          <span className="text-xs font-medium text-primary/80">0</span>
        </div>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <PermissionGuard
          permissions={[
            PermissionActions.leads.editar,
            PermissionActions.leads.gestionar,
          ]}
        >
          <LeadSheetForm
            lead={lead}
            open={isUpdateOpen}
            onOpenChange={closeUpdateModal}
          />
        </PermissionGuard>

        {/* Modal de eliminación */}
        <PermissionGuard
          permissions={[
            PermissionActions.leads.eliminar,
            PermissionActions.leads.gestionar,
          ]}
        >
          <DeleteLeadAlertDialog
            isOpen={isDeleteOpen}
            onOpenChange={closeDeleteModal}
            onConfirmDelete={handleDelete}
            leadName={lead.companyName}
            isLoading={deleteLeadMutation.isPending}
          />
        </PermissionGuard>

        <PermissionGuard
          permissions={[
            PermissionActions.leads.editar,
            PermissionActions.leads.gestionar,
          ]}
        >
          <ReasignLeadDialog
            isOpen={isReasignOpen}
            onOpenChange={closeReasignModal}
            leadId={lead.id}
          />
        </PermissionGuard>
      </div>
    </div>
  );
});

export function LeadKanbanCardOverlay({ lead }: { lead: Lead }) {
  return (
    <div className="cursor-grabbing rounded-xl border border-border/60 bg-card p-4 shadow-xl scale-[1.03] rotate-[1deg] opacity-90">
      {/* Header: Status badge */}
      <div className="flex items-center justify-between mb-3">
        <LeadStatusBadge status={lead.status} />
      </div>

      {/* Company name + avatar */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="font-semibold text-sm text-foreground leading-snug">
          {lead.companyName}
        </h4>
        {lead.assignedToName && (
          <Avatar className="size-7 shrink-0 border border-border/50">
            <AvatarFallback className="text-[10px] font-medium bg-muted text-muted-foreground">
              {getInitials(lead.assignedToName)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Sector */}
      {lead.sectorName && (
        <p className="text-xs text-muted-foreground truncate mb-3">
          {lead.sectorName}
        </p>
      )}

      {/* Date row */}
      <div className="flex items-center gap-1.5">
        <HugeiconsIcon
          icon={Calendar}
          className="text-muted-foreground/70"
          size={14}
        />
        <span className="text-xs text-muted-foreground">
          {format(new Date(lead.createdAt), "dd MMM yyyy", { locale: es })}
        </span>
      </div>
    </div>
  );
}
