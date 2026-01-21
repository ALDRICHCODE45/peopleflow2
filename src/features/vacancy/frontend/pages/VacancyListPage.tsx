"use client";

import { useState, useMemo, useCallback } from "react";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { usePaginatedVacanciesQuery } from "../hooks/usePaginatedVacanciesQuery";
import { useCreateVacancy } from "../hooks/useCreateVacancy";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { DataTable } from "@/core/shared/components/DataTable/DataTable";
import { VacancyColumns } from "../components/columns/VacancyColumns";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { createTableConfig } from "@/core/shared/helpers/createTableConfig";
import { VacanciesTableConfig } from "../components/tableConfig/VacanciesTableConfig";
import {
  DataTableTabs,
  TabConfig,
} from "@/core/shared/components/DataTable/DataTableTabs";
import {
  Layers,
  PlayCircleIcon,
  FileEditIcon,
  Lock,
  Archive,
} from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { VacancySheetForm } from "../components/VacancySheetForm";
import { useDebouncedValue } from "@/core/shared/hooks/useDebouncedValue";
import { VacancyStatus } from "../types/vacancy.types";
import { useQueryClient } from "@tanstack/react-query";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";

export function VacancyListPage() {
  const queryClient = useQueryClient();
  const createVacancyMutation = useCreateVacancy();
  const { isOpen, openModal, closeModal } = useModalState();

  // Estado para server-side pagination
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Debounce para búsqueda (300ms)
  const debouncedSearch = useDebouncedValue(globalFilter, 300);

  // Determinar el filtro de status basado en el tab activo
  const statusFilter: VacancyStatus | undefined =
    activeTab !== "all" ? (activeTab as VacancyStatus) : undefined;

  // Query con paginación server-side
  const { data, isLoading, isFetching, refetch } = usePaginatedVacanciesQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
    globalFilter: debouncedSearch || undefined,
    status: statusFilter,
  });

  // Extraer datos de la respuesta paginada
  const vacancies = data?.data ?? [];
  const paginationMeta = data?.pagination;

  // Handler para cambio de tab - resetea a página 0
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  // Handler para cambio de globalFilter - resetea a página 0
  const handleGlobalFilterChange = useCallback((value: string) => {
    setGlobalFilter(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  // Configuracion de tabs (los conteos se actualizan dinámicamente con el total)
  const tabsConfig: TabConfig[] = useMemo(
    () => [
      {
        id: "all",
        label: "Todas",
        count: activeTab === "all" ? paginationMeta?.totalCount : undefined,
        icon: Layers,
      },
      {
        id: "OPEN",
        label: "Abiertas",
        count: activeTab === "OPEN" ? paginationMeta?.totalCount : undefined,
        filterValue: "OPEN",
        icon: PlayCircleIcon,
      },
      {
        id: "DRAFT",
        label: "Borrador",
        count: activeTab === "DRAFT" ? paginationMeta?.totalCount : undefined,
        filterValue: "DRAFT",
        icon: FileEditIcon,
      },
      {
        id: "CLOSED",
        label: "Cerradas",
        count: activeTab === "CLOSED" ? paginationMeta?.totalCount : undefined,
        filterValue: "CLOSED",
        icon: Lock,
      },
      {
        id: "ARCHIVED",
        label: "Archivadas",
        count:
          activeTab === "ARCHIVED" ? paginationMeta?.totalCount : undefined,
        filterValue: "ARCHIVED",
        icon: Archive,
      },
    ],
    [activeTab, paginationMeta?.totalCount],
  );

  const handleAdd = useCallback(() => {
    openModal();
  }, [openModal]);

  const handleCreateVacancy = async (
    data: Parameters<typeof createVacancyMutation.mutateAsync>[0],
  ) => {
    const result = await createVacancyMutation.mutateAsync(data);
    if (result) {
      closeModal();
      // Invalidar todas las queries de vacantes para refrescar
      queryClient.invalidateQueries({ queryKey: ["vacancies"] });
    }
    return { error: null, vacancy: result };
  };

  // Configuración de la tabla con server-side habilitado
  const tableConfig = useMemo(
    () =>
      createTableConfig(VacanciesTableConfig, {
        onAdd: handleAdd,
        serverSide: {
          enabled: true,
          totalCount: paginationMeta?.totalCount ?? 0,
          pageCount: paginationMeta?.pageCount ?? 0,
          isLoading,
          isFetching,
        },
      }),
    [paginationMeta, isLoading, isFetching, handleAdd],
  );

  return (
    <Card className="p-2 m-1">
      <CardContent>
        <div className="space-y-6">
          {/* Header con titulo y acciones */}

          <TablePresentation
            title="Gestion de Vacantes"
            subtitle="Administra las vacantes de tu organizacion"
          />

          {/* Tabs de filtrado */}
          <DataTableTabs
            tabs={tabsConfig}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Tabla con Server-Side Pagination */}
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
              // Server-side: Estado controlado
              pagination={pagination}
              sorting={sorting}
              // Server-side: Callbacks
              onPaginationChange={setPagination}
              onSortingChange={setSorting}
              onGlobalFilterChange={handleGlobalFilterChange}
            />
          </PermissionGuard>

          {/* Modal de crear vacante */}
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
