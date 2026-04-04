"use client";

import { useMemo, useCallback, useState } from "react";
import { usePaginatedVacanciesQuery } from "../hooks/usePaginatedVacanciesQuery";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { usePermissions } from "@/core/shared/hooks/use-permissions";
import { DataTable } from "@/core/shared/components/DataTable/DataTable";
import { createVacancyColumns } from "../components/columns/VacancyColumns";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { createTableConfig } from "@/core/shared/helpers/createTableConfig";
import { VacanciesTableConfig } from "../components/tableConfig/VacanciesTableConfig";
import { DataTableMultiTabs } from "@/core/shared/components/DataTable/DataTableMultiTabs";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { VacancySheetForm } from "../components/VacancySheetForm";
import { VacancyDetailSheet } from "../components/VacancyDetailSheet";
import { useServerPaginatedTable } from "@/core/shared/hooks/useServerPaginatedTable";
import type { VacancyStatusType } from "../types/vacancy.types";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";
import { enrichVacancyTabsWithCounts } from "../config/vacancyTabsConfig";
import { useVacanciesFilters } from "../components/tableConfig/hooks/useVacanciesFilters";
import type { VacancyDTO } from "../types/vacancy.types";
import { BulkDeleteVacanciesDialog } from "../components/BulkDeleteVacanciesDialog";
import { BulkReassignVacanciesDialog } from "../components/BulkReassignVacanciesDialog";
import { BulkDuplicateVacanciesDialog } from "../components/BulkDuplicateVacanciesDialog";

export function VacancyListPage() {
  const { hasAnyPermission, isSuperAdmin } = usePermissions();
  const canCreateVacancy =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.vacantes.crear,
      PermissionActions.vacantes.gestionar,
    ]);

  const { isOpen, openModal, closeModal } = useModalState();
  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(null);
  const [selectionResetSignal, setSelectionResetSignal] = useState(0);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkReassignOpen, setBulkReassignOpen] = useState(false);
  const [bulkDuplicateOpen, setBulkDuplicateOpen] = useState(false);
  const [selectedBulkIds, setSelectedBulkIds] = useState<string[]>([]);
  const [selectedBulkVacancies, setSelectedBulkVacancies] = useState<VacancyDTO[]>([]);

  // Server-side pagination state with multi-tab support
  const {
    pagination,
    sorting,
    activeTabs,
    debouncedSearch,
    statusFilters,
    setSorting,
    handleGlobalFilterChange,
    handleMultiTabChange,
    createPaginationHandler,
    setPagination,
    globalFilter,
  } = useServerPaginatedTable<VacancyStatusType>({ initialPageSize: 10 });

  // Advanced filters state
  const {
    filters,
    hasActiveFilters,
    setStatuses,
    setSaleTypes,
    setModalities,
    setRecruiterIds,
    setClientIds,
    setCountryCodes,
    setRegionCodes,
    setRequiresPsychometry,
    setSalaryMin,
    setSalaryMax,
    setAssignedAtFrom,
    setAssignedAtTo,
    setTargetDeliveryDateFrom,
    setTargetDeliveryDateTo,
    clearFilters: clearAdvancedFilters,
  } = useVacanciesFilters();

  // Merge tab statuses with multi-select statuses (tabs take precedence when active)
  const effectiveStatuses = useMemo(() => {
    if (statusFilters.length > 0) return statusFilters;
    return filters.statuses.length > 0 ? filters.statuses : undefined;
  }, [statusFilters, filters.statuses]);

  // Query with server-side pagination and all filters
  const { data, isFetching, isPending } = usePaginatedVacanciesQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
    globalFilter: debouncedSearch || undefined,
    statuses: effectiveStatuses,
    saleTypes: filters.saleTypes.length > 0 ? filters.saleTypes : undefined,
    modalities: filters.modalities.length > 0 ? filters.modalities : undefined,
    recruiterIds: filters.recruiterIds.length > 0 ? filters.recruiterIds : undefined,
    clientIds: filters.clientIds.length > 0 ? filters.clientIds : undefined,
    countryCodes: filters.countryCodes.length > 0 ? filters.countryCodes : undefined,
    regionCodes: filters.regionCodes.length > 0 ? filters.regionCodes : undefined,
    requiresPsychometry: filters.requiresPsychometry,
    salaryMin: filters.salaryMin,
    salaryMax: filters.salaryMax,
    assignedAtFrom: filters.assignedAtFrom || undefined,
    assignedAtTo: filters.assignedAtTo || undefined,
    targetDeliveryDateFrom: filters.targetDeliveryDateFrom || undefined,
    targetDeliveryDateTo: filters.targetDeliveryDateTo || undefined,
  });

  // Extract data from paginated response
  const vacancies = data?.data ?? [];
  const paginationMeta = data?.pagination;
  const totalCount = paginationMeta?.totalCount ?? 0;

  // Solo mostrar skeleton si es carga inicial SIN datos previos
  const showInitialLoading = isPending && !data;

  // Tabs config with dynamic counts
  const tabsConfig = useMemo(
    () => enrichVacancyTabsWithCounts(activeTabs, totalCount),
    [activeTabs, totalCount]
  );

  const handleAdd = useCallback(() => {
    openModal();
  }, [openModal]);

  const handleClearFilters = useCallback(() => {
    handleGlobalFilterChange("");
    handleMultiTabChange([]);
    clearAdvancedFilters();
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [handleGlobalFilterChange, handleMultiTabChange, clearAdvancedFilters, setPagination]);

  const handleViewDetail = useCallback((id: string) => {
    setSelectedVacancyId(id);
  }, []);

  const handleBulkDelete = useCallback((rows: VacancyDTO[]) => {
    setSelectedBulkIds(rows.map((vacancy) => vacancy.id));
    setBulkDeleteOpen(true);
  }, []);

  const handleBulkReassign = useCallback((rows: VacancyDTO[]) => {
    setSelectedBulkIds(rows.map((vacancy) => vacancy.id));
    setSelectedBulkVacancies(rows);
    setBulkReassignOpen(true);
  }, []);

  const handleBulkDuplicate = useCallback((ids: string[]) => {
    setSelectedBulkIds(ids);
    setBulkDuplicateOpen(true);
  }, []);

  const handleBulkCompleted = useCallback(() => {
    setBulkDeleteOpen(false);
    setBulkReassignOpen(false);
    setBulkDuplicateOpen(false);
    setSelectedBulkIds([]);
    setSelectedBulkVacancies([]);
    setSelectionResetSignal((current) => current + 1);
  }, []);

  // Columns factory with detail handler
  const columns = useMemo(
    () => createVacancyColumns(handleViewDetail),
    [handleViewDetail]
  );

  // Table configuration with server-side enabled
  const tableConfig = useMemo(
    () =>
      createTableConfig(VacanciesTableConfig, {
        onAdd: canCreateVacancy ? handleAdd : undefined,
        onClearFilters: handleClearFilters,
        // Inline filters
        globalFilter: globalFilter ?? "",
        selectedStatuses: filters.statuses,
        onStatusesChange: setStatuses,
        // Sheet filters
        selectedSaleTypes: filters.saleTypes,
        onSaleTypesChange: setSaleTypes,
        selectedModalities: filters.modalities,
        onModalitiesChange: setModalities,
        selectedRecruiterIds: filters.recruiterIds,
        onRecruiterIdsChange: setRecruiterIds,
        selectedClientIds: filters.clientIds,
        onClientIdsChange: setClientIds,
        selectedCountryCodes: filters.countryCodes,
        onCountryCodesChange: setCountryCodes,
        selectedRegionCodes: filters.regionCodes,
        onRegionCodesChange: setRegionCodes,
        requiresPsychometry: filters.requiresPsychometry,
        onRequiresPsychometryChange: setRequiresPsychometry,
        salaryMin: filters.salaryMin,
        onSalaryMinChange: setSalaryMin,
        salaryMax: filters.salaryMax,
        onSalaryMaxChange: setSalaryMax,
        assignedAtFrom: filters.assignedAtFrom,
        onAssignedAtFromChange: setAssignedAtFrom,
        assignedAtTo: filters.assignedAtTo,
        onAssignedAtToChange: setAssignedAtTo,
        targetDeliveryDateFrom: filters.targetDeliveryDateFrom,
        onTargetDeliveryDateFromChange: setTargetDeliveryDateFrom,
        targetDeliveryDateTo: filters.targetDeliveryDateTo,
        onTargetDeliveryDateToChange: setTargetDeliveryDateTo,
        hasActiveSheetFilters: hasActiveFilters,
        onBulkDelete: handleBulkDelete,
        onBulkReasign: handleBulkReassign,
        onBulkDuplicate: handleBulkDuplicate,
        serverSide: {
          enabled: true,
          totalCount,
          pageCount: paginationMeta?.pageCount ?? 0,
        },
      }),
    [
      totalCount,
      paginationMeta?.pageCount,
      canCreateVacancy,
      handleAdd,
      handleClearFilters,
      globalFilter,
      filters,
      hasActiveFilters,
      setStatuses,
      setSaleTypes,
      setModalities,
      setRecruiterIds,
      setClientIds,
      setCountryCodes,
      setRegionCodes,
      setRequiresPsychometry,
      setSalaryMin,
      setSalaryMax,
      setAssignedAtFrom,
      setAssignedAtTo,
      setTargetDeliveryDateFrom,
      setTargetDeliveryDateTo,
      handleBulkDelete,
      handleBulkReassign,
      handleBulkDuplicate,
    ]
  );

  return (
    <>
      <Card className="p-2 m-1">
        <CardContent>
          <div className="space-y-6">
            <TablePresentation
              title="Gestión de Vacantes"
              subtitle="Administra las vacantes de tu organización"
            />

            <DataTableMultiTabs
              tabs={tabsConfig}
              activeTabs={activeTabs}
              onTabsChange={handleMultiTabChange}
            />

            <PermissionGuard
              permissions={[
                PermissionActions.vacantes.acceder,
                PermissionActions.vacantes.gestionar,
              ]}
            >
              <DataTable
                columns={columns}
                data={vacancies}
                config={tableConfig}
                isLoading={showInitialLoading}
                isFetching={isFetching && !showInitialLoading}
                pagination={pagination}
                sorting={sorting}
                onPaginationChange={createPaginationHandler(totalCount)}
                onSortingChange={setSorting}
                onGlobalFilterChange={handleGlobalFilterChange}
                clearSelectionSignal={selectionResetSignal}
              />
            </PermissionGuard>

            <PermissionGuard
              permissions={[
                PermissionActions.vacantes.crear,
                PermissionActions.vacantes.gestionar,
              ]}
            >
              {isOpen && (
                <VacancySheetForm open={isOpen} onOpenChange={closeModal} />
              )}
            </PermissionGuard>
          </div>
        </CardContent>
      </Card>

      {/* Detail Sheet — shown when a row is selected */}
      <VacancyDetailSheet
        vacancyId={selectedVacancyId}
        onClose={() => setSelectedVacancyId(null)}
      />

      <BulkDeleteVacanciesDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => {
          setBulkDeleteOpen(open);
          if (!open) {
            setSelectedBulkIds([]);
          }
        }}
        selectedIds={selectedBulkIds}
        onCompleted={handleBulkCompleted}
      />

      <BulkReassignVacanciesDialog
        open={bulkReassignOpen}
        onOpenChange={(open) => {
          setBulkReassignOpen(open);
          if (!open) {
            setSelectedBulkIds([]);
            setSelectedBulkVacancies([]);
          }
        }}
        selectedIds={selectedBulkIds}
        selectedVacancies={selectedBulkVacancies}
        onCompleted={handleBulkCompleted}
      />

      <BulkDuplicateVacanciesDialog
        open={bulkDuplicateOpen}
        onOpenChange={(open) => {
          setBulkDuplicateOpen(open);
          if (!open) {
            setSelectedBulkIds([]);
          }
        }}
        selectedIds={selectedBulkIds}
        onCompleted={handleBulkCompleted}
      />
    </>
  );
}
