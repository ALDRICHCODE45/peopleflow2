"use client";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Lead, LeadStatus } from "../../types";
import type { KanbanColumn as KanbanColumnType } from "./kanbanTypes";
import { LeadKanbanCard } from "./LeadKanbanCard";
import { Badge } from "@/core/shared/ui/shadcn/badge";

const COLUMN_DOT_COLORS: Record<LeadStatus, string> = {
  CONTACTO: "bg-cyan-500",
  CONTACTO_CALIDO: "bg-blue-500",
  SOCIAL_SELLING: "bg-purple-500",
  CITA_AGENDADA: "bg-yellow-500",
  CITA_ATENDIDA: "bg-orange-500",
  CITA_VALIDADA: "bg-green-500",
  POSICIONES_ASIGNADAS: "bg-emerald-500",
  STAND_BY: "bg-gray-500",
};

interface KanbanColumnProps {
  column: KanbanColumnType;
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

export function KanbanColumn({
  column,
  leads,
  onSelectLead,
}: KanbanColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${column.id}`,
    data: { type: "column", column },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const leadIds = leads.map((l) => l.id);

  return (
    <div
      ref={setSortableRef}
      style={style}
      className="flex w-72 flex-shrink-0 flex-col rounded-lg bg-muted/50 border"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center gap-2 p-3 cursor-grab active:cursor-grabbing"
      >
        <span
          className={`w-2.5 h-2.5 rounded-full ${COLUMN_DOT_COLORS[column.id]}`}
        />
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <Badge variant="secondary" className="ml-auto text-xs">
          {leads.length}
        </Badge>
      </div>

      <div
        ref={setDroppableRef}
        className="flex flex-1 flex-col gap-2 p-2 pt-0 min-h-[200px] overflow-y-auto max-h-[calc(100vh-250px)]"
      >
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadKanbanCard
              key={lead.id}
              lead={lead}
              onSelect={onSelectLead}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
