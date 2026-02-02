"use client";

import { memo, useMemo, useEffect, useRef, useCallback } from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Lead, LeadStatus } from "../../types";
import type { KanbanColumn as KanbanColumnType } from "./kanbanTypes";
import {
  LeadKanbanCard,
  type LeadPermissions,
  type LeadCardActions,
} from "./LeadKanbanCard";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { Spinner } from "@/core/shared/ui/shadcn/spinner";
import { usePermissions } from "@/core/shared/hooks/use-permissions";
import { PermissionActions } from "@/core/shared/constants/permissions";

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
  totalCount?: number;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  /** Lifted action callbacks for card dialogs */
  cardActions: LeadCardActions;
}

export const KanbanColumn = memo(function KanbanColumn({
  column,
  leads,
  onSelectLead,
  totalCount,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  cardActions,
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

  // Compute permissions once at column level to avoid per-card lookups
  const { hasAnyPermission } = usePermissions();
  const leadPermissions = useMemo<LeadPermissions>(
    () => ({
      canEdit: hasAnyPermission([
        PermissionActions.leads.editar,
        PermissionActions.leads.gestionar,
      ]),
      canDelete: hasAnyPermission([
        PermissionActions.leads.eliminar,
        PermissionActions.leads.gestionar,
      ]),
    }),
    [hasAnyPermission],
  );

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `drop-${column.id}`,
    data: { type: "column", column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Memoize leadIds to prevent unnecessary re-renders of SortableContext
  const leadIds = useMemo(() => leads.map((l) => l.id), [leads]);

  // Ref for intersection observer (infinite scroll trigger)
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Use refs for volatile values to prevent IntersectionObserver recreation
  // This avoids GC pressure and lost events when dependencies change frequently
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingRef = useRef(isFetchingNextPage);
  const fetchNextPageRef = useRef(fetchNextPage);

  // Keep refs in sync with props
  useEffect(() => {
    hasNextPageRef.current = hasNextPage;
    isFetchingRef.current = isFetchingNextPage;
    fetchNextPageRef.current = fetchNextPage;
  });

  // Intersection observer for loading more leads when scrolling to bottom
  // Observer is created once and uses refs for volatile values
  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextPageRef.current &&
          !isFetchingRef.current &&
          fetchNextPageRef.current
        ) {
          fetchNextPageRef.current();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []); // Empty deps - observer created once, uses refs for state

  // Display count: show totalCount if available (from server), otherwise leads.length
  const displayCount = totalCount ?? leads.length;

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
          {displayCount}
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
              permissions={leadPermissions}
              actions={cardActions}
            />
          ))}
        </SortableContext>

        {/* Trigger element for infinite scroll */}
        <div ref={loadMoreRef} className="h-4 shrink-0">
          {isFetchingNextPage && (
            <div className="flex justify-center py-2">
              <Spinner className="size-5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
