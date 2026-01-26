"use client";

import { useMemo, useCallback } from "react";
import { usePaginatedVacanciesQuery } from "../hooks/usePaginatedVacanciesQuery";
import { useCreateVacancy } from "../hooks/useCreateVacancy";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { DataTable } from "@/core/shared/components/DataTable/DataTable";
import { VacancyColumns } from "../components/columns/VacancyColumns";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { createTableConfig } from "@/core/shared/helpers/createTableConfig";
import { VacanciesTableConfig } from "../components/tableConfig/VacanciesTableConfig";
import { DataTableTabs } from "@/core/shared/components/DataTable/DataTableTabs";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { VacancySheetForm } from "../components/VacancySheetForm";
import { useServerPaginatedTable } from "@/core/shared/hooks/useServerPaginatedTable";
import { VacancyStatus } from "../types/vacancy.types";
import { useQueryClient } from "@tanstack/react-query";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";
import {
  enrichVacancyTabsWithCounts,
  type VacancyTabId,
} from "../config/vacancyTabsConfig";

export function VacancyListPage() {
  const queryClient = useQueryClient();
  const createVacancyMutation = useCreateVacancy();
  const { isOpen, openModal, closeModal } = useModalState();

  // Server-side pagination state with smart pageSize handling
  const {
    pagination,
    sorting,
    activeTab,
    debouncedSearch,
    statusFilter,
    setSorting,
    handleGlobalFilterChange,
    handleTabChange,
    createPaginationHandler,
  } = useServerPaginatedTable<VacancyStatus>({ initialPageSize: 10 });

  // Query with server-side pagination
  const { data, isLoading, isFetching } = usePaginatedVacanciesQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
    globalFilter: debouncedSearch || undefined,
    status: statusFilter,
  });

  // Extract data from paginated response
  const vacancies = data?.data ?? [];
  const paginationMeta = data?.pagination;
  const totalCount = paginationMeta?.totalCount ?? 0;

  // Tabs config with dynamic counts
  const tabsConfig = useMemo(
    () => enrichVacancyTabsWithCounts(activeTab as VacancyTabId, totalCount),
    [activeTab, totalCount]
  );

  const handleAdd = useCallback(() => {
    openModal();
  }, [openModal]);

  const handleCreateVacancy = async (
    data: Parameters<typeof createVacancyMutation.mutateAsync>[0]
  ) => {
    const result = await createVacancyMutation.mutateAsync(data);
    if (result) {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["vacancies"] });
    }
    return { error: null, vacancy: result };
  };

  // Table configuration with server-side enabled
  const tableConfig = useMemo(
    () =>
      createTableConfig(VacanciesTableConfig, {
        onAdd: handleAdd,
        serverSide: {
          enabled: true,
          totalCount,
          pageCount: paginationMeta?.pageCount ?? 0,
          isLoading,
          isFetching,
        },
      }),
    [totalCount, paginationMeta?.pageCount, isLoading, isFetching, handleAdd]
  );

  return (
    <Card className="p-2 m-1">
      <CardContent>
        <div className="space-y-6">
          <TablePresentation
            title="Gestion de Vacantes"
            subtitle="Administra las vacantes de tu organizacion"
          />

          <DataTableTabs
            tabs={tabsConfig}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          <PermissionGuard
            permissions={[
              PermissionActions.vacantes.acceder,
              PermissionActions.vacantes.gestionar,
            ]}
          >
            <DataTable
              columns={VacancyColumns}
              data={vacancies}
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
              PermissionActions.vacantes.crear,
              PermissionActions.vacantes.gestionar,
            ]}
          >
            {isOpen && (
              <VacancySheetForm
                onSubmit={handleCreateVacancy}
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
