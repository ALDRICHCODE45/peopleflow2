"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@shadcn/card";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { Button } from "@/core/shared/ui/shadcn/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";
import { useUpdateLeadStatus, useDeleteLead } from "../hooks/useLeads";
import { usePrefetchLeadDetails } from "../hooks/usePrefetchLeadDetails";
import { useKanbanFilters } from "../hooks/useKanbanFilters";
import { useKanbanDragAndDrop } from "../hooks/useKanbanDragAndDrop";
import { useKanbanInfiniteQueries } from "../hooks/useKanbanInfiniteQueries";
import { KanbanFilters } from "../components/KanbanView/KanbanFilters";
import { KanbanBoard } from "../components/KanbanView/KanbanBoard";
import { LeadDetailSheet } from "../components/TableView/LeadDetailSheet";
import { LeadSheetForm } from "../components/TableView/LeadSheetForm";
import { DeleteLeadAlertDialog } from "../components/TableView/DeleteLeadAlertDialog";
import { ReasignLeadDialog } from "../components/KanbanView/ReasignLeadDialog";
import { IncompleteLeadDialog } from "../components/TableView/IncompleteLeadDialog";
import type { Lead } from "../types";
import type { LeadCardActions } from "../components/KanbanView/LeadKanbanCard";

/** Type for centralized dialog state - only one dialog can be open at a time */
type KanbanDialogType = "edit" | "delete" | "reasign" | null;

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

  // Centralized dialog state - lifted from LeadKanbanCard for performance
  // Instead of 4000+ dialogs mounted (one per card), we have just 3 at page level
  const [dialogState, setDialogState] = useState<{
    type: KanbanDialogType;
    lead: Lead | null;
  }>({ type: null, lead: null });

  const deleteLeadMutation = useDeleteLead();

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
      employeeCounts:
        filters.debouncedEmployeeCounts.length > 0
          ? filters.debouncedEmployeeCounts
          : undefined,
      countryCodes:
        filters.debouncedCountryCodes.length > 0
          ? filters.debouncedCountryCodes
          : undefined,
      regionCodes:
        filters.debouncedRegionCodes.length > 0
          ? filters.debouncedRegionCodes
          : undefined,
      postalCode: filters.debouncedPostalCode || undefined,
      createdAtFrom: filters.debouncedDateFrom || undefined,
      createdAtTo: filters.debouncedDateTo || undefined,
    }),
    [
      filters.debouncedSearch,
      filters.debouncedSectorIds,
      filters.debouncedOriginIds,
      filters.debouncedAssignedToIds,
      filters.debouncedEmployeeCounts,
      filters.debouncedCountryCodes,
      filters.debouncedRegionCodes,
      filters.debouncedPostalCode,
      filters.debouncedDateFrom,
      filters.debouncedDateTo,
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

  // Centralized dialog handlers - lifted from LeadKanbanCard for performance
  const openDialog = useCallback((type: KanbanDialogType, lead: Lead) => {
    setDialogState({ type, lead });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState({ type: null, lead: null });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!dialogState.lead) return;
    await deleteLeadMutation.mutateAsync(dialogState.lead.id);
    closeDialog();
  }, [dialogState.lead, deleteLeadMutation, closeDialog]);

  // Memoized card actions passed to all cards - prevents creating new callbacks per card
  const cardActions: LeadCardActions = useMemo(
    () => ({
      onEdit: (lead) => openDialog("edit", lead),
      onDelete: (lead) => openDialog("delete", lead),
      onReasign: (lead) => openDialog("reasign", lead),
    }),
    [openDialog]
  );

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
            cardActions={cardActions}
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

        {/* Centralized dialogs - lifted from LeadKanbanCard for performance */}
        {/* Only 3 dialogs mounted instead of 4000+ (one per card) */}
        {dialogState.lead && dialogState.type === "edit" && (
          <LeadSheetForm
            lead={dialogState.lead}
            open
            onOpenChange={(open) => {
              if (!open) closeDialog();
            }}
          />
        )}

        {dialogState.lead && dialogState.type === "delete" && (
          <DeleteLeadAlertDialog
            isOpen
            onOpenChange={(open) => {
              if (!open) closeDialog();
            }}
            onConfirmDelete={handleDeleteConfirm}
            leadName={dialogState.lead.companyName}
            isLoading={deleteLeadMutation.isPending}
          />
        )}

        {dialogState.lead && dialogState.type === "reasign" && (
          <ReasignLeadDialog
            isOpen
            onOpenChange={(open) => {
              if (!open) closeDialog();
            }}
            leadId={dialogState.lead.id}
            leadName={dialogState.lead.companyName}
            currentAssignedToId={dialogState.lead.assignedToId}
          />
        )}
      </CardContent>
    </Card>
  );
};
