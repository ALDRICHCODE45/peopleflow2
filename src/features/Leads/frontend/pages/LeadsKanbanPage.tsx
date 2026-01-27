"use client";

import { useMemo, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensors,
  useSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Card, CardContent } from "@shadcn/card";
import { Button } from "@/core/shared/ui/shadcn/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";
import { usePaginatedLeadsQuery } from "../hooks/usePaginatedLeadsQuery";
import { useUpdateLeadStatus } from "../hooks/useLeads";
import { DEFAULT_KANBAN_COLUMNS } from "../components/KanbanView/kanbanTypes";
import type { KanbanColumn as KanbanColumnType } from "../components/KanbanView/kanbanTypes";
import { KanbanColumn } from "../components/KanbanView/KanbanColumn";
import { LeadKanbanCardOverlay } from "../components/KanbanView/LeadKanbanCard";
import { LeadDetailSheet } from "../components/TableView/LeadDetailSheet";
import { LeadSheetForm } from "../components/TableView/LeadSheetForm";
import type { Lead, LeadStatus } from "../types";

export const LeadsKabanPage = () => {
  const [columns, setColumns] = useState<KanbanColumnType[]>(
    DEFAULT_KANBAN_COLUMNS,
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"lead" | "column" | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  // Sheet states
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch all leads (large page size for kanban)
  const { data } = usePaginatedLeadsQuery({
    pageIndex: 0,
    pageSize: 500,
  });

  const updateStatusMutation = useUpdateLeadStatus();

  const leads = data?.data ?? [];

  // Group leads by status
  const leadsByStatus = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    for (const col of columns) {
      grouped[col.id] = [];
    }
    for (const lead of leads) {
      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
      }
    }
    return grouped;
  }, [leads, columns]);

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  // Column IDs for SortableContext
  const columnIds = useMemo(
    () => columns.map((c) => `column-${c.id}`),
    [columns],
  );

  // Find which column a lead belongs to
  const findColumnForLead = useCallback(
    (leadId: string): LeadStatus | null => {
      const lead = leads.find((l) => l.id === leadId);
      return lead?.status ?? null;
    },
    [leads],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;
    const data = active.data.current;

    if (data?.type === "column") {
      setActiveType("column");
      setActiveId(id);
    } else if (data?.type === "lead") {
      setActiveType("lead");
      setActiveId(id);
      setActiveLead(data.lead);
    }
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      // Only handle lead dragging over columns
      if (activeData?.type !== "lead") return;

      // Determine target column
      let targetColumnId: LeadStatus | null = null;

      if (overData?.type === "column") {
        targetColumnId = overData.column.id;
      } else if (overData?.type === "lead") {
        targetColumnId = findColumnForLead(over.id as string);
      }

      if (!targetColumnId) return;

      const currentStatus = findColumnForLead(active.id as string);
      if (currentStatus === targetColumnId) return;

      // No local optimistic reordering needed - we just need the drop target
    },
    [findColumnForLead],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);
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
        let targetColumnId: LeadStatus | null = null;

        if (overData?.type === "column") {
          targetColumnId = overData.column.id;
        } else if (overData?.type === "lead") {
          targetColumnId = findColumnForLead(over.id as string);
        }

        // Also check if dropped directly on a column droppable (over.id is the column status)
        if (!targetColumnId) {
          const overIdStr = over.id as string;
          const columnExists = columns.find((c) => c.id === overIdStr);
          if (columnExists) {
            targetColumnId = columnExists.id;
          }
        }

        if (!targetColumnId) return;

        const leadId = active.id as string;
        const currentStatus = findColumnForLead(leadId);

        if (currentStatus && currentStatus !== targetColumnId) {
          updateStatusMutation.mutate({
            leadId,
            newStatus: targetColumnId,
          });
        }
      }
    },
    [columns, findColumnForLead, updateStatusMutation],
  );

  const handleSelectLead = useCallback((lead: Lead) => {
    setSelectedLead(lead);
  }, []);

  return (
    <Card className="p-2 m-1">
      <CardContent className="min-h-[75vh]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <TablePresentation
              title="Gestion de Leads"
              subtitle="Administra los leads de tu organizacion."
            />
            <Button onClick={() => setIsCreating(true)} size="sm">
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              Nuevo Lead
            </Button>
          </div>

          {/* Filtros placeholder */}
          <div>{/* Espacio reservado para filtros */}</div>

          <div className="overflow-x-auto pb-4 min-h-[75%]">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
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
                      onSelectLead={handleSelectLead}
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
        </div>

        {/* Lead Detail Sheet */}
        {selectedLead && (
          <LeadDetailSheet
            lead={selectedLead}
            open={!!selectedLead}
            onOpenChange={(open) => {
              if (!open) setSelectedLead(null);
            }}
          />
        )}

        {/* Create Lead Sheet */}
        <LeadSheetForm
          open={isCreating}
          onOpenChange={(open) => {
            if (!open) setIsCreating(false);
          }}
        />
      </CardContent>
    </Card>
  );
};
