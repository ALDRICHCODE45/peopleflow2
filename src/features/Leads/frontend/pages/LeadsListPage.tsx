"use client";

import { useMemo, useCallback, useState } from "react";
import { useDebouncedValue } from "@/core/shared/hooks/useDebouncedValue";
import { usePaginatedLeadsQuery } from "../hooks/usePaginatedLeadsQuery";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { DataTable } from "@/core/shared/components/DataTable/DataTable";
import { LeadColumns } from "../components/TableView/columns/LeadColumns";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { createTableConfig } from "@/core/shared/helpers/createTableConfig";
import { LeadsTableConfig } from "../components/TableView/tableConfig/LeadsTableConfig";
import { DataTableMultiTabs } from "@/core/shared/components/DataTable/DataTableMultiTabs";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { LeadSheetForm } from "../components/TableView/LeadSheetForm";
import { useServerPaginatedTable } from "@/core/shared/hooks/useServerPaginatedTable";
import type { LeadStatus } from "../types";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";
import { enrichLeadTabsWithCounts } from "../config/leadTabsConfig";

export function LeadsListPage() {
  const { isOpen, openModal, closeModal } = useModalState();

  // Server-side filter state for sector and origin (now multi-select)
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([]);
  const [selectedOriginIds, setSelectedOriginIds] = useState<string[]>([]);
  const [selectedAssignedToIds, setSelectedAssignedToIds] = useState<string[]>(
    []
  );
  const [selectedEmployeeCounts, setSelectedEmployeeCounts] = useState<string[]>(
    []
  );
  const [selectedCountryCodes, setSelectedCountryCodes] = useState<string[]>([]);
  const [selectedRegionCodes, setSelectedRegionCodes] = useState<string[]>([]);
  const [postalCode, setPostalCode] = useState<string>("");
  const debouncedPostalCode = useDebouncedValue(postalCode, 300);
  const [createdAtFrom, setCreatedAtFrom] = useState<string>("");
  const [createdAtTo, setCreatedAtTo] = useState<string>("");

  // Server-side pagination state with multi-tab support
  const {
    pagination,
    sorting,
    activeTabs,
    debouncedSearch,
    statusFilters,
    setPagination,
    setSorting,
    handleGlobalFilterChange,
    handleMultiTabChange,
    createPaginationHandler,
  } = useServerPaginatedTable<LeadStatus>({ initialPageSize: 10 });

  // Handlers for sector/origin changes - reset to page 0
  const handleSectorChange = useCallback(
    (ids: string[]) => {
      setSelectedSectorIds(ids);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    [setPagination]
  );

  const handleOriginChange = useCallback(
    (ids: string[]) => {
      setSelectedOriginIds(ids);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    [setPagination]
  );

  const handleAssignedToChange = useCallback(
    (ids: string[]) => {
      setSelectedAssignedToIds(ids);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    [setPagination]
  );

  const handleEmployeeCountsChange = useCallback(
    (counts: string[]) => {
      setSelectedEmployeeCounts(counts);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    [setPagination]
  );

  const handleCountryChange = useCallback(
    (codes: string[]) => {
      setSelectedCountryCodes(codes);
      setSelectedRegionCodes([]);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    [setPagination]
  );

  const handleRegionChange = useCallback(
    (codes: string[]) => {
      setSelectedRegionCodes(codes);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    [setPagination]
  );

  const handlePostalCodeChange = useCallback(
    (value: string) => {
      setPostalCode(value);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    [setPagination]
  );

  const handleDateFromChange = useCallback(
    (date: string) => {
      setCreatedAtFrom(date);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    [setPagination]
  );

  const handleDateToChange = useCallback(
    (date: string) => {
      setCreatedAtTo(date);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    [setPagination]
  );

  // Handler to clear all filters
  const handleClearFilters = useCallback(() => {
    setSelectedSectorIds([]);
    setSelectedOriginIds([]);
    setSelectedAssignedToIds([]);
    setSelectedEmployeeCounts([]);
    setSelectedCountryCodes([]);
    setSelectedRegionCodes([]);
    setPostalCode("");
    setCreatedAtFrom("");
    setCreatedAtTo("");
    handleMultiTabChange([]);
    handleGlobalFilterChange("");
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [handleGlobalFilterChange, handleMultiTabChange, setPagination]);

  // Query with server-side pagination
  const { data, isLoading, isFetching, isPending } = usePaginatedLeadsQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
    globalFilter: debouncedSearch || undefined,
    statuses: statusFilters.length > 0 ? statusFilters : undefined,
    sectorIds: selectedSectorIds.length > 0 ? selectedSectorIds : undefined,
    originIds: selectedOriginIds.length > 0 ? selectedOriginIds : undefined,
    assignedToIds:
      selectedAssignedToIds.length > 0 ? selectedAssignedToIds : undefined,
    employeeCounts:
      selectedEmployeeCounts.length > 0 ? selectedEmployeeCounts : undefined,
    countryCodes:
      selectedCountryCodes.length > 0 ? selectedCountryCodes : undefined,
    regionCodes:
      selectedRegionCodes.length > 0 ? selectedRegionCodes : undefined,
    postalCode: debouncedPostalCode || undefined,
    createdAtFrom: createdAtFrom || undefined,
    createdAtTo: createdAtTo || undefined,
  });

  // Extract data from paginated response
  const leads = data?.data ?? [];
  const paginationMeta = data?.pagination;
  const totalCount = paginationMeta?.totalCount ?? 0;

  // Solo mostrar skeleton si es carga inicial SIN datos previos
  // isPending es true cuando la query no tiene datos cacheados y está cargando
  const showInitialLoading = isPending && !data;

  // Tabs config with dynamic counts
  const tabsConfig = useMemo(
    () => enrichLeadTabsWithCounts(activeTabs, totalCount),
    [activeTabs, totalCount]
  );

  const handleAdd = useCallback(() => {
    openModal();
  }, [openModal]);

  // Table configuration with server-side enabled
  // Nota: isLoading e isFetching se pasan como props separadas al DataTable
  // para evitar recálculos del config en cada cambio de estado de carga
  const tableConfig = useMemo(
    () =>
      createTableConfig(LeadsTableConfig, {
        onAdd: handleAdd,
        // Props for controlled filter component
        selectedSectorIds,
        selectedOriginIds,
        onSectorChange: handleSectorChange,
        onOriginChange: handleOriginChange,
        onClearFilters: handleClearFilters,
        selectedAssignedToIds,
        onAssignedToChange: handleAssignedToChange,
        // Employee counts filter
        selectedEmployeeCounts,
        onEmployeeCountsChange: handleEmployeeCountsChange,
        // Country/region filter
        selectedCountryCodes,
        selectedRegionCodes,
        onCountryChange: handleCountryChange,
        onRegionChange: handleRegionChange,
        // Postal code filter
        postalCode,
        onPostalCodeChange: handlePostalCodeChange,
        // Date range filter
        createdAtFrom,
        createdAtTo,
        onDateFromChange: handleDateFromChange,
        onDateToChange: handleDateToChange,

        serverSide: {
          enabled: true,
          totalCount,
          pageCount: paginationMeta?.pageCount ?? 0,
          // No incluir isLoading/isFetching aquí - se pasan como props separadas
        },
      }),
    [
      totalCount,
      paginationMeta?.pageCount,
      handleAdd,
      selectedSectorIds,
      selectedOriginIds,
      handleSectorChange,
      handleOriginChange,
      handleClearFilters,
      selectedAssignedToIds,
      handleAssignedToChange,
      selectedEmployeeCounts,
      handleEmployeeCountsChange,
      selectedCountryCodes,
      selectedRegionCodes,
      handleCountryChange,
      handleRegionChange,
      postalCode,
      handlePostalCodeChange,
      createdAtFrom,
      createdAtTo,
      handleDateFromChange,
      handleDateToChange,
    ]
  );

  return (
    <Card className="p-2 m-1">
      <CardContent>
        <div className="space-y-6">
          <TablePresentation
            title="Gestion de Leads"
            subtitle="Administra los leads de tu organizacion"
          />

          <DataTableMultiTabs
            tabs={tabsConfig}
            activeTabs={activeTabs}
            onTabsChange={handleMultiTabChange}
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
              isLoading={showInitialLoading}
              isFetching={isFetching && !showInitialLoading}
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
            <LeadSheetForm open={isOpen} onOpenChange={closeModal} />
          </PermissionGuard>
        </div>
      </CardContent>
    </Card>
  );
}
