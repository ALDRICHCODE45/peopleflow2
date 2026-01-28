"use client";

import {
  DndContext,
  DragOverlay,
  pointerWithin,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { LeadKanbanCardOverlay } from "./LeadKanbanCard";
import type { Lead } from "../../types";
import type { UseKanbanDragAndDropReturn } from "../../hooks/useKanbanDragAndDrop";

interface KanbanBoardProps {
  dnd: UseKanbanDragAndDropReturn;
  leadsByStatus: Record<string, Lead[]>;
  onSelectLead: (lead: Lead) => void;
}

export function KanbanBoard({
  dnd,
  leadsByStatus,
  onSelectLead,
}: KanbanBoardProps) {
  const {
    columns,
    sensors,
    columnIds,
    activeType,
    activeLead,
    handleDragStart,
    handleDragEnd,
  } = dnd;

  return (
    <div className="overflow-x-auto pb-4 min-h-[75%]">
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={columnIds}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-4 min-w-max min-h-[75vh] items-stretch">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                leads={leadsByStatus[column.id] ?? []}
                onSelectLead={onSelectLead}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeType === "lead" && activeLead ? (
            <LeadKanbanCardOverlay lead={activeLead} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
