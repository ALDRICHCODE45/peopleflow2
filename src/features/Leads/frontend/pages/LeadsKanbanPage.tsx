"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@shadcn/card";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { Button } from "@/core/shared/ui/shadcn/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";
import { useUpdateLeadStatus } from "../hooks/useLeads";
import { usePrefetchLeadDetails } from "../hooks/usePrefetchLeadDetails";
import { useKanbanFilters } from "../hooks/useKanbanFilters";
import { useKanbanDragAndDrop } from "../hooks/useKanbanDragAndDrop";
import { useKanbanInfiniteQueries } from "../hooks/useKanbanInfiniteQueries";
import { KanbanFilters } from "../components/KanbanView/KanbanFilters";
import { KanbanBoard } from "../components/KanbanView/KanbanBoard";
import { LeadDetailSheet } from "../components/TableView/LeadDetailSheet";
import { LeadSheetForm } from "../components/TableView/LeadSheetForm";
import { IncompleteLeadDialog } from "../components/TableView/IncompleteLeadDialog";
import type { Lead } from "../types";

export const LeadsKabanPage = () => {
  const filters = useKanbanFilters();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [incompleteData, setIncompleteData] = useState<{
    leadId: string;
    missingFields: string[];
  } | null>(null);

  // Memoize filter object to prevent unnecessary query invalidations
  const queryFilters = useMemo(
    () => ({
      search: filters.debouncedSearch || undefined,
      sectorIds:
        filters.debouncedSectorIds.length > 0
          ? filters.debouncedSectorIds
          : undefined,
      originIds:
        filters.debouncedOriginIds.length > 0
          ? filters.debouncedOriginIds
          : undefined,
      assignedToIds:
        filters.debouncedAssignedToIds.length > 0
          ? filters.debouncedAssignedToIds
          : undefined,
    }),
    [
      filters.debouncedSearch,
      filters.debouncedSectorIds,
      filters.debouncedOriginIds,
      filters.debouncedAssignedToIds,
    ],
  );

  // Use infinite queries for per-column pagination (20 leads per page)
  const {
    leadsByStatus,
    totalCountByStatus,
    queryByStatus,
    allLeads,
    isFetching,
  } = useKanbanInfiniteQueries(queryFilters);

  // Show loading when filters are pending (debounce) or queries are fetching
  const isFiltersLoading = filters.isFiltersPending || isFetching;

  // Calculate total leads count from server-provided counts (zero additional queries)
  const totalLeadsCount = useMemo(() => {
    return Object.values(totalCountByStatus).reduce((sum, count) => sum + count, 0);
  }, [totalCountByStatus]);

  const updateStatusMutation = useUpdateLeadStatus();
  const prefetchLeadDetails = usePrefetchLeadDetails();

  const handleIncompleteData = useCallback(
    (data: { leadId: string; missingFields: string[] }) => {
      // Find the lead and store it for editing (not for detail sheet)
      const lead = allLeads.find((l) => l.id === data.leadId);
      if (lead) {
        setLeadToEdit(lead);
      }
      setIncompleteData(data);
    },
    [allLeads],
  );

  // Pass allLeads for drag & drop status lookups
  const dnd = useKanbanDragAndDrop({
    leads: allLeads,
    updateStatusMutation,
    onIncompleteData: handleIncompleteData,
  });

  const handleSelectLead = useCallback((lead: Lead) => {
    prefetchLeadDetails(lead.id); // Backup prefetch in case hover didn't trigger
    setSelectedLead(lead);
  }, [prefetchLeadDetails]);

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

          {/* Total Leads Counter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Total:</span>
            {isFiltersLoading ? (
              <Badge variant="secondary" className="animate-pulse min-w-[2.5rem] justify-center">
                ---
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-semibold">
                {totalLeadsCount.toLocaleString()}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {totalLeadsCount === 1 ? "lead encontrado" : "leads encontrados"}
            </span>
          </div>

          <KanbanBoard
            dnd={dnd}
            leadsByStatus={leadsByStatus}
            totalCountByStatus={totalCountByStatus}
            queryByStatus={queryByStatus}
            onSelectLead={handleSelectLead}
            isFiltersLoading={isFiltersLoading}
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

        <LeadSheetForm
          lead={leadToEdit ?? undefined}
          open={isEditing}
          onOpenChange={(open) => {
            if (!open) {
              setIsEditing(false);
              setLeadToEdit(null);
            }
          }}
        />

        <IncompleteLeadDialog
          open={!!incompleteData}
          onOpenChange={(open) => {
            if (!open) {
              setIncompleteData(null);
            }
          }}
          missingFields={incompleteData?.missingFields ?? []}
          onEditLead={() => {
            setIncompleteData(null);
            setIsEditing(true);
          }}
        />
      </CardContent>
    </Card>
  );
};
