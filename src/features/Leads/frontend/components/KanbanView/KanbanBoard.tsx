"use client";

import { memo } from "react";
import { DndContext, DragOverlay, pointerWithin } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Spinner } from "@shadcn/spinner";
import { KanbanColumn } from "./KanbanColumn";
import { LeadKanbanCardOverlay, type LeadCardActions } from "./LeadKanbanCard";
import type { Lead, LeadStatus } from "../../types";
import type { UseKanbanDragAndDropReturn } from "../../hooks/useKanbanDragAndDrop";
import type { UseInfiniteLeadsByStatusReturn } from "../../hooks/useInfiniteLeadsByStatus";

interface KanbanBoardProps {
  dnd: UseKanbanDragAndDropReturn;
  leadsByStatus: Record<string, Lead[]>;
  totalCountByStatus?: Record<LeadStatus, number>;
  queryByStatus?: Map<LeadStatus, UseInfiniteLeadsByStatusReturn>;
  onSelectLead: (lead: Lead) => void;
  isFiltersLoading?: boolean;
  /** Lifted action callbacks for card dialogs - centralized at page level */
  cardActions: LeadCardActions;
}

export const KanbanBoard = memo(function KanbanBoard({
  dnd,
  leadsByStatus,
  totalCountByStatus,
  queryByStatus,
  onSelectLead,
  isFiltersLoading = false,
  cardActions,
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
    <div className="relative overflow-x-auto pb-4 min-h-[75%]">
      {/* Loading overlay */}
      {isFiltersLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-[1px] rounded-lg transition-opacity duration-200">
          <div className="flex items-center gap-3 bg-card px-4 py-3 rounded-lg shadow-lg border border-border/50">
            <Spinner className="size-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Aplicando filtros...
            </span>
          </div>
        </div>
      )}
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
            {columns.map((column) => {
              const query = queryByStatus?.get(column.id);
              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  leads={leadsByStatus[column.id] ?? []}
                  totalCount={totalCountByStatus?.[column.id]}
                  hasNextPage={query?.hasNextPage}
                  isFetchingNextPage={query?.isFetchingNextPage}
                  fetchNextPage={query?.fetchNextPage}
                  onSelectLead={onSelectLead}
                  cardActions={cardActions}
                />
              );
            })}
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
});
