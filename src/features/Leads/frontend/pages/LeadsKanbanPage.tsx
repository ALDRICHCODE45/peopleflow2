"use client";

import { useMemo, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  pointerWithin,
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
import { Input } from "@shadcn/input";
import { Label } from "@shadcn/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Filter, Search } from "@hugeicons/core-free-icons";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";
import { FilterMultiSelect } from "@/core/shared/components/DataTable/FilterMultiSelect";
import { usePaginatedLeadsQuery } from "../hooks/usePaginatedLeadsQuery";
import { useUpdateLeadStatus } from "../hooks/useLeads";
import { useSectors } from "../hooks/useCatalogs";
import { DEFAULT_KANBAN_COLUMNS } from "../components/KanbanView/kanbanTypes";
import type { KanbanColumn as KanbanColumnType } from "../components/KanbanView/kanbanTypes";
import { KanbanColumn } from "../components/KanbanView/KanbanColumn";
import { LeadKanbanCardOverlay } from "../components/KanbanView/LeadKanbanCard";
import { LeadDetailSheet } from "../components/TableView/LeadDetailSheet";
import { LeadSheetForm } from "../components/TableView/LeadSheetForm";
import { SheetFilters } from "../components/TableView/tableConfig/SheetFilters";
import { useModalState } from "@/core/shared/hooks";
import { useDebouncedValue } from "@/core/shared/hooks/useDebouncedValue";
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

  // Search filter with debounce
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebouncedValue(searchValue, 300);

  // Multi-select filters
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([]);
  const [selectedOriginIds, setSelectedOriginIds] = useState<string[]>([]);
  const [selectedAssignedToIds, setSelectedAssignedToIds] = useState<string[]>([]);

  // Sheet modal for advanced filters
  const { openModal: openSheetFilters, isOpen: isSheetOpen, closeModal: closeSheetFilters } = useModalState();

  // Catalog data for sector filter
  const { data: sectors = [] } = useSectors();
  const sectorOptions = useMemo(() => sectors.map(s => ({ value: s.id, label: s.name })), [sectors]);

  // Clear all filters handler
  const handleClearFilters = useCallback(() => {
    setSearchValue("");
    setSelectedSectorIds([]);
    setSelectedOriginIds([]);
    setSelectedAssignedToIds([]);
  }, []);

  const hasActiveFilters = searchValue.length > 0 || selectedSectorIds.length > 0 || selectedOriginIds.length > 0 || selectedAssignedToIds.length > 0;

  // Fetch all leads (large page size for kanban)
  const { data, isFetching } = usePaginatedLeadsQuery({
    pageIndex: 0,
    pageSize: 500,
    globalFilter: debouncedSearch || undefined,
    sectorIds: selectedSectorIds.length > 0 ? selectedSectorIds : undefined,
    originIds: selectedOriginIds.length > 0 ? selectedOriginIds : undefined,
    assignedToIds: selectedAssignedToIds.length > 0 ? selectedAssignedToIds : undefined,
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

        // Fallback: extract column status from prefixed droppable/sortable IDs
        if (!targetColumnId) {
          const overIdStr = over.id as string;
          let candidateId: string | null = null;

          if (overIdStr.startsWith("drop-")) {
            candidateId = overIdStr.slice(5);
          } else if (overIdStr.startsWith("column-")) {
            candidateId = overIdStr.slice(7);
          }

          if (candidateId) {
            const columnExists = columns.find((c) => c.id === candidateId);
            if (columnExists) {
              targetColumnId = columnExists.id;
            }
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

          {/* Filtros */}
          <div className="flex flex-wrap gap-3 items-end">
            {/* Búsqueda */}
            <div className="space-y-2 min-w-0 w-56">
              <Label htmlFor="kanban-search" className="text-xs font-medium">
                Búsqueda
              </Label>
              <div className="relative w-full min-w-0">
                <Input
                  id="kanban-search"
                  className="w-full pl-9 min-w-0"
                  placeholder="Buscar lead..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
                <HugeiconsIcon
                  icon={Search}
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>

            {/* Sector multi-select */}
            <div className="w-56">
              <FilterMultiSelect
                label="Sector"
                options={sectorOptions}
                selected={selectedSectorIds}
                onChange={setSelectedSectorIds}
                placeholder="Todos los sectores"
              />
            </div>

            {/* Más filtros (origin + assigned user) */}
            <div className="space-y-2 min-w-0">
              <Label className="text-xs font-medium">Más filtros</Label>
              <Button
                onClick={openSheetFilters}
                variant="outline-primary"
                className="w-full min-w-0"
              >
                <HugeiconsIcon
                  icon={Filter}
                  className="h-5 w-5 text-primary shrink"
                />
                Filtros
              </Button>
              <SheetFilters
                isSheetOpen={isSheetOpen}
                onOpenChange={closeSheetFilters}
                selectedOriginIds={selectedOriginIds}
                onOriginChange={setSelectedOriginIds}
                selectedAssignedToIds={selectedAssignedToIds}
                onAssignedToChange={setSelectedAssignedToIds}
              />
            </div>

            {/* Limpiar filtros */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>

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
