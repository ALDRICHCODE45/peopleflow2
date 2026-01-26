"use client";

import { useMemo, useCallback, useState } from "react";
import { usePaginatedLeadsQuery } from "../hooks/usePaginatedLeadsQuery";
import { useCreateLead } from "../hooks/useLeads";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { DataTable } from "@/core/shared/components/DataTable/DataTable";
import { LeadColumns } from "../components/columns/LeadColumns";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { createTableConfig } from "@/core/shared/helpers/createTableConfig";
import { LeadsTableConfig } from "../components/tableConfig/LeadsTableConfig";
import { DataTableTabs } from "@/core/shared/components/DataTable/DataTableTabs";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { LeadSheetForm } from "../components/LeadSheetForm";
import { useServerPaginatedTable } from "@/core/shared/hooks/useServerPaginatedTable";
import type { LeadStatus, LeadFormData } from "../types";
import { useQueryClient } from "@tanstack/react-query";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";
import {
  enrichLeadTabsWithCounts,
  type LeadTabId,
} from "../config/leadTabsConfig";

export function LeadsListPage() {
  const queryClient = useQueryClient();
  const createLeadMutation = useCreateLead();
  const { isOpen, openModal, closeModal } = useModalState();

  // Server-side filter state for sector and origin
  const [selectedSectorId, setSelectedSectorId] = useState<
    string | undefined
  >();
  const [selectedOriginId, setSelectedOriginId] = useState<
    string | undefined
  >();

  // Server-side pagination state with smart pageSize handling
  const {
    pagination,
    sorting,
    activeTab,
    debouncedSearch,
    statusFilter,
    setPagination,
    setSorting,
    handleGlobalFilterChange,
    handleTabChange,
    createPaginationHandler,
  } = useServerPaginatedTable<LeadStatus>({ initialPageSize: 10 });

  // Handlers for sector/origin changes - reset to page 0
  const handleSectorChange = useCallback(
    (sectorId: string | undefined) => {
      setSelectedSectorId(sectorId === "todos" ? undefined : sectorId);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    [setPagination],
  );

  const handleOriginChange = useCallback(
    (originId: string | undefined) => {
      setSelectedOriginId(originId === "todos" ? undefined : originId);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    [setPagination],
  );

  // Handler to clear all filters
  const handleClearFilters = useCallback(() => {
    setSelectedSectorId(undefined);
    setSelectedOriginId(undefined);
    handleGlobalFilterChange("");
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [handleGlobalFilterChange, setPagination]);

  // Query with server-side pagination
  const { data, isLoading, isFetching } = usePaginatedLeadsQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
    globalFilter: debouncedSearch || undefined,
    status: statusFilter,
    sectorId: selectedSectorId,
    originId: selectedOriginId,
  });

  // Extract data from paginated response
  const leads = data?.data ?? [];
  const paginationMeta = data?.pagination;
  const totalCount = paginationMeta?.totalCount ?? 0;

  // Tabs config with dynamic counts
  const tabsConfig = useMemo(
    () => enrichLeadTabsWithCounts(activeTab as LeadTabId, totalCount),
    [activeTab, totalCount],
  );

  const handleAdd = useCallback(() => {
    openModal();
  }, [openModal]);

  const handleCreateLead = async (formData: LeadFormData) => {
    const result = await createLeadMutation.mutateAsync(formData);
    if (result) {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    }
    return { error: null, lead: result };
  };

  // Table configuration with server-side enabled
  const tableConfig = useMemo(
    () =>
      createTableConfig(LeadsTableConfig, {
        onAdd: handleAdd,
        // Props for controlled filter component
        selectedSectorId,
        selectedOriginId,
        onSectorChange: handleSectorChange,
        onOriginChange: handleOriginChange,
        onClearFilters: handleClearFilters,
        serverSide: {
          enabled: true,
          totalCount,
          pageCount: paginationMeta?.pageCount ?? 0,
          isLoading,
          isFetching,
        },
      }),
    [
      totalCount,
      paginationMeta?.pageCount,
      isLoading,
      isFetching,
      handleAdd,
      selectedSectorId,
      selectedOriginId,
      handleSectorChange,
      handleOriginChange,
      handleClearFilters,
    ],
  );

  return (
    <Card className="p-2 m-1">
      <CardContent>
        <div className="space-y-6">
          <TablePresentation
            title="Gestion de Leads"
            subtitle="Administra los leads de tu organizacion"
          />

          <DataTableTabs
            tabs={tabsConfig}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          <PermissionGuard
            permissions={[
              PermissionActions.leads.acceder,
              PermissionActions.leads.gestionar,
            ]}
          >
            <DataTable
              columns={LeadColumns}
              data={leads}
              config={tableConfig}
              isLoading={isLoading}
              pagination={pagination}
              sorting={sorting}
              onPaginationChange={createPaginationHandler(totalCount)}
              onSortingChange={setSorting}
              onGlobalFilterChange={handleGlobalFilterChange}
            />
          </PermissionGuard>

          <PermissionGuard
            permissions={[
              PermissionActions.leads.crear,
              PermissionActions.leads.gestionar,
            ]}
          >
            {isOpen && (
              <LeadSheetForm
                onSubmit={handleCreateLead}
                open={true}
                onOpenChange={closeModal}
              />
            )}
          </PermissionGuard>
        </div>
      </CardContent>
    </Card>
  );
}
