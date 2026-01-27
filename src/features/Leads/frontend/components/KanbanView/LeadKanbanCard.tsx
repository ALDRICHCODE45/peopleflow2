"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Lead } from "../../types";
import { LeadStatusBadge } from "../TableView/LeadStatusBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface LeadKanbanCardProps {
  lead: Lead;
  onSelect: (lead: Lead) => void;
}

export function LeadKanbanCard({ lead, onSelect }: LeadKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(lead)}
      className="cursor-grab active:cursor-grabbing rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm truncate max-w-[180px]">
          {lead.companyName}
        </h4>
        <LeadStatusBadge status={lead.status} />
      </div>

      {lead.sectorName && (
        <p className="text-xs text-muted-foreground truncate mb-1">
          {lead.sectorName}
        </p>
      )}

      <div className="flex items-center justify-between mt-2">
        {lead.assignedToName && (
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
            {lead.assignedToName}
          </span>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {format(new Date(lead.createdAt), "dd MMM", { locale: es })}
        </span>
      </div>
    </div>
  );
}

export function LeadKanbanCardOverlay({ lead }: { lead: Lead }) {
  return (
    <div className="cursor-grabbing rounded-lg border bg-card p-3 shadow-xl scale-[1.03] rotate-[1deg] opacity-90">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm truncate max-w-[180px]">
          {lead.companyName}
        </h4>
        <LeadStatusBadge status={lead.status} />
      </div>

      {lead.sectorName && (
        <p className="text-xs text-muted-foreground truncate mb-1">
          {lead.sectorName}
        </p>
      )}

      <div className="flex items-center justify-between mt-2">
        {lead.assignedToName && (
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
            {lead.assignedToName}
          </span>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {format(new Date(lead.createdAt), "dd MMM", { locale: es })}
        </span>
      </div>
    </div>
  );
}
