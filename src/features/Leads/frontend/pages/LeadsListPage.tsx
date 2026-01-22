"use client";

import { useState, useMemo, useCallback } from "react";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { usePaginatedLeadsQuery } from "../hooks/usePaginatedLeadsQuery";
import { useCreateLead } from "../hooks/useLeads";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { DataTable } from "@/core/shared/components/DataTable/DataTable";
import { LeadColumns } from "../components/columns/LeadColumns";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { createTableConfig } from "@/core/shared/helpers/createTableConfig";
import { LeadsTableConfig } from "../components/tableConfig/LeadsTableConfig";
import {
  DataTableTabs,
  TabConfig,
} from "@/core/shared/components/DataTable/DataTableTabs";
import {
  Layers,
  Target01Icon,
  Calendar03Icon,
  CheckmarkCircle01Icon,
  PauseIcon,
  UserGroupIcon,
  MessageMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { LeadSheetForm } from "../components/LeadSheetForm";
import { useDebouncedValue } from "@/core/shared/hooks/useDebouncedValue";
import type { LeadStatus, LeadFormData, Lead } from "../types";
import { useQueryClient } from "@tanstack/react-query";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";

export function LeadsListPage() {
  const queryClient = useQueryClient();
  const createLeadMutation = useCreateLead();
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
  const statusFilter: LeadStatus | undefined =
    activeTab !== "all" ? (activeTab as LeadStatus) : undefined;

  // Query con paginación server-side
  const { data, isLoading, isFetching } = usePaginatedLeadsQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
    globalFilter: debouncedSearch || undefined,
    status: statusFilter,
  });

  // Extraer datos de la respuesta paginada
  const leads = data?.data ?? [];
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
        label: "Todos",
        count: activeTab === "all" ? paginationMeta?.totalCount : undefined,
        icon: Layers,
      },
      {
        id: "CONTACTO_CALIDO",
        label: "Contacto Cálido",
        count: activeTab === "CONTACTO_CALIDO" ? paginationMeta?.totalCount : undefined,
        filterValue: "CONTACTO_CALIDO",
        icon: Target01Icon,
      },
      {
        id: "SOCIAL_SELLING",
        label: "Social Selling",
        count: activeTab === "SOCIAL_SELLING" ? paginationMeta?.totalCount : undefined,
        filterValue: "SOCIAL_SELLING",
        icon: MessageMultiple02Icon,
      },
      {
        id: "CITA_AGENDADA",
        label: "Cita Agendada",
        count: activeTab === "CITA_AGENDADA" ? paginationMeta?.totalCount : undefined,
        filterValue: "CITA_AGENDADA",
        icon: Calendar03Icon,
      },
      {
        id: "CITA_VALIDADA",
        label: "Cita Validada",
        count: activeTab === "CITA_VALIDADA" ? paginationMeta?.totalCount : undefined,
        filterValue: "CITA_VALIDADA",
        icon: CheckmarkCircle01Icon,
      },
      {
        id: "POSICIONES_ASIGNADAS",
        label: "Posiciones",
        count: activeTab === "POSICIONES_ASIGNADAS" ? paginationMeta?.totalCount : undefined,
        filterValue: "POSICIONES_ASIGNADAS",
        icon: UserGroupIcon,
      },
      {
        id: "STAND_BY",
        label: "Stand By",
        count: activeTab === "STAND_BY" ? paginationMeta?.totalCount : undefined,
        filterValue: "STAND_BY",
        icon: PauseIcon,
      },
    ],
    [activeTab, paginationMeta?.totalCount]
  );

  const handleAdd = useCallback(() => {
    openModal();
  }, [openModal]);

  const handleCreateLead = async (formData: LeadFormData) => {
    const result = await createLeadMutation.mutateAsync(formData);
    if (result) {
      closeModal();
      // Invalidar todas las queries de leads para refrescar
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    }
    return { error: null, lead: result };
  };

  // Configuración de la tabla con server-side habilitado
  const tableConfig = useMemo(
    () =>
      createTableConfig(LeadsTableConfig, {
        onAdd: handleAdd,
        serverSide: {
          enabled: true,
          totalCount: paginationMeta?.totalCount ?? 0,
          pageCount: paginationMeta?.pageCount ?? 0,
          isLoading,
          isFetching,
        },
      }),
    [paginationMeta, isLoading, isFetching, handleAdd]
  );

  return (
    <Card className="p-2 m-1">
      <CardContent>
        <div className="space-y-6">
          {/* Header con titulo y acciones */}
          <TablePresentation
            title="Gestión de Leads"
            subtitle="Administra los leads de tu organización"
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
              PermissionActions.leads.acceder,
              PermissionActions.leads.gestionar,
            ]}
          >
            <DataTable
              columns={LeadColumns}
              data={leads}
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

          {/* Modal de crear lead */}
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
