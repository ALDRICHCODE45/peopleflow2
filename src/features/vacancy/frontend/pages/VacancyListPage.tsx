"use client";

import { useMemo, useCallback, useState } from "react";
import { usePaginatedVacanciesQuery } from "../hooks/usePaginatedVacanciesQuery";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
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

export function VacancyListPage() {
  const { isOpen, openModal, closeModal } = useModalState();
  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(
    null
  );

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
  } = useServerPaginatedTable<VacancyStatusType>({ initialPageSize: 10 });

  // Query with server-side pagination
  const { data, isFetching, isPending } = usePaginatedVacanciesQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
    globalFilter: debouncedSearch || undefined,
    statuses: statusFilters.length > 0 ? statusFilters : undefined,
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
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [handleGlobalFilterChange, handleMultiTabChange, setPagination]);

  const handleViewDetail = useCallback((id: string) => {
    setSelectedVacancyId(id);
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
        onAdd: handleAdd,
        onClearFilters: handleClearFilters,
        serverSide: {
          enabled: true,
          totalCount,
          pageCount: paginationMeta?.pageCount ?? 0,
        },
      }),
    [totalCount, paginationMeta?.pageCount, handleAdd, handleClearFilters]
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
    </>
  );
}
