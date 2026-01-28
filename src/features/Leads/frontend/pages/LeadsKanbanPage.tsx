"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@shadcn/card";
import { Button } from "@/core/shared/ui/shadcn/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";
import { useUpdateLeadStatus } from "../hooks/useLeads";
import { useKanbanFilters } from "../hooks/useKanbanFilters";
import { useKanbanDragAndDrop } from "../hooks/useKanbanDragAndDrop";
import { useKanbanInfiniteQueries } from "../hooks/useKanbanInfiniteQueries";
import { KanbanFilters } from "../components/KanbanView/KanbanFilters";
import { KanbanBoard } from "../components/KanbanView/KanbanBoard";
import { LeadDetailSheet } from "../components/TableView/LeadDetailSheet";
import { LeadSheetForm } from "../components/TableView/LeadSheetForm";
import type { Lead } from "../types";

export const LeadsKabanPage = () => {
  const filters = useKanbanFilters();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Use infinite queries for per-column pagination (20 leads per page)
  const {
    leadsByStatus,
    totalCountByStatus,
    queryByStatus,
    allLeads,
  } = useKanbanInfiniteQueries({
    search: filters.debouncedSearch || undefined,
    sectorIds:
      filters.selectedSectorIds.length > 0
        ? filters.selectedSectorIds
        : undefined,
    originIds:
      filters.selectedOriginIds.length > 0
        ? filters.selectedOriginIds
        : undefined,
    assignedToIds:
      filters.selectedAssignedToIds.length > 0
        ? filters.selectedAssignedToIds
        : undefined,
  });

  const updateStatusMutation = useUpdateLeadStatus();
  // Pass allLeads for drag & drop status lookups
  const dnd = useKanbanDragAndDrop({ leads: allLeads, updateStatusMutation });

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

          <KanbanFilters {...filters} />
          <KanbanBoard
            dnd={dnd}
            leadsByStatus={leadsByStatus}
            totalCountByStatus={totalCountByStatus}
            queryByStatus={queryByStatus}
            onSelectLead={handleSelectLead}
          />
        </div>

        {selectedLead && (
          <LeadDetailSheet
            lead={selectedLead}
            open={!!selectedLead}
            onOpenChange={(open) => {
              if (!open) setSelectedLead(null);
            }}
          />
        )}

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
