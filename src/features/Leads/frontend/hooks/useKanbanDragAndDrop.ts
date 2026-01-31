"use client";

import { useMemo, useState, useCallback } from "react";
import {
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensors,
  useSensor,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  DEFAULT_KANBAN_COLUMNS,
  type KanbanColumn,
} from "../components/KanbanView/kanbanTypes";
import type { Lead, LeadStatus } from "../types";
import type { useUpdateLeadStatus } from "./useLeads";

interface IncompleteDataError {
  leadId: string;
  missingFields: string[];
}

interface UseKanbanDragAndDropParams {
  leads: Lead[];
  updateStatusMutation: ReturnType<typeof useUpdateLeadStatus>;
  onIncompleteData?: (data: IncompleteDataError) => void;
}

export function useKanbanDragAndDrop({
  leads,
  updateStatusMutation,
  onIncompleteData,
}: UseKanbanDragAndDropParams) {
  const [columns, setColumns] = useState<KanbanColumn[]>(
    DEFAULT_KANBAN_COLUMNS,
  );
  const [activeType, setActiveType] = useState<"lead" | "column" | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const columnIds = useMemo(
    () => columns.map((c) => `column-${c.id}`),
    [columns],
  );

  // Create Map for O(1) lead status lookups instead of O(n) find
  const leadStatusMap = useMemo(() => {
    const map = new Map<string, LeadStatus>();
    leads.forEach((lead) => map.set(lead.id, lead.status));
    return map;
  }, [leads]);

  // Create Set for O(1) column ID validation
  const columnIdSet = useMemo(
    () => new Set(columns.map((c) => c.id)),
    [columns]
  );

  const findColumnForLead = useCallback(
    (leadId: string): LeadStatus | null => {
      return leadStatusMap.get(leadId) ?? null;
    },
    [leadStatusMap],
  );

  const resolveDropTargetColumn = useCallback(
    (
      overData: Record<string, unknown> | undefined,
      overId: string,
    ): LeadStatus | null => {
      if (overData?.type === "column") {
        return (overData.column as KanbanColumn).id;
      }
      if (overData?.type === "lead") {
        return findColumnForLead(overId);
      }

      // Fallback: extract column status from prefixed droppable/sortable IDs
      let candidateId: string | null = null;
      if (overId.startsWith("drop-")) {
        candidateId = overId.slice(5);
      } else if (overId.startsWith("column-")) {
        candidateId = overId.slice(7);
      }

      // Use Set for O(1) validation instead of array.find
      if (candidateId && columnIdSet.has(candidateId as LeadStatus)) {
        return candidateId as LeadStatus;
      }

      return null;
    },
    [columnIdSet, findColumnForLead],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;

    if (data?.type === "column") {
      setActiveType("column");
    } else if (data?.type === "lead") {
      setActiveType("lead");
      setActiveLead(data.lead);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveType(null);
      setActiveLead(null);

      if (!over) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      // Handle column reorder
      if (activeData?.type === "column" && overData?.type === "column") {
        const activeColumnId = activeData.column.id;
        const overColumnId = overData.column.id;

        if (activeColumnId !== overColumnId) {
          setColumns((prev) => {
            const oldIndex = prev.findIndex((c) => c.id === activeColumnId);
            const newIndex = prev.findIndex((c) => c.id === overColumnId);
            return arrayMove(prev, oldIndex, newIndex);
          });
        }
        return;
      }

      // Handle lead dropped on column or on another lead
      if (activeData?.type === "lead") {
        const targetColumnId = resolveDropTargetColumn(
          overData,
          over.id as string,
        );

        if (!targetColumnId) return;

        const leadId = active.id as string;
        const currentStatus = findColumnForLead(leadId);

        if (currentStatus && currentStatus !== targetColumnId) {
          updateStatusMutation.mutate(
            {
              leadId,
              newStatus: targetColumnId,
            },
            {
              onError: (error: Error) => {
                if (
                  error.message === "INCOMPLETE_DATA" &&
                  onIncompleteData
                ) {
                  const typedError = error as Error & {
                    missingFields: string[];
                  };
                  onIncompleteData({
                    leadId,
                    missingFields: typedError.missingFields || [],
                  });
                }
              },
            },
          );
        }
      }
    },
    [resolveDropTargetColumn, findColumnForLead, updateStatusMutation, onIncompleteData],
  );

  return {
    columns,
    sensors,
    columnIds,
    activeType,
    activeLead,
    handleDragStart,
    handleDragEnd,
  };
}

export type UseKanbanDragAndDropReturn = ReturnType<
  typeof useKanbanDragAndDrop
>;
