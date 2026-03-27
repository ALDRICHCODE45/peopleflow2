"use client";

import { useMemo, useCallback } from "react";
import { usePaginatedClientsQuery } from "../hooks/usePaginatedClientsQuery";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { usePermissions } from "@/core/shared/hooks/use-permissions";
import { DataTable } from "@/core/shared/components/DataTable/DataTable";
import { createClientColumns } from "../components/columns/ClientColumns";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { createTableConfig } from "@/core/shared/helpers/createTableConfig";
import { ClientesTableConfig } from "../components/tableConfig/ClientesTableConfig";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { useServerPaginatedTable } from "@/core/shared/hooks/useServerPaginatedTable";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";
import { CreateClientDialog } from "../components/CreateClientDialog";

export function ClientListPage() {
  const { hasAnyPermission, isSuperAdmin } = usePermissions();
  const canCreateClient =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.clientes.crear,
      PermissionActions.clientes.gestionar,
    ]);

  const { isOpen, openModal, closeModal } = useModalState();

  // Server-side pagination state (no tabs for clients)
  const {
    pagination,
    sorting,
    debouncedSearch,
    setPagination,
    setSorting,
    handleGlobalFilterChange,
    createPaginationHandler,
  } = useServerPaginatedTable({ initialPageSize: 10 });

  // Handler to clear all filters
  const handleClearFilters = useCallback(() => {
    handleGlobalFilterChange("");
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [handleGlobalFilterChange, setPagination]);

  // Query with server-side pagination
  const { data, isFetching, isPending } = usePaginatedClientsQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
    globalFilter: debouncedSearch || undefined,
  });

  // Extract data from paginated response
  const clients = data?.data ?? [];
  const paginationMeta = data?.pagination;
  const totalCount = paginationMeta?.totalCount ?? 0;

  // Solo mostrar skeleton si es carga inicial SIN datos previos
  const showInitialLoading = isPending && !data;

  const handleAdd = useCallback(() => {
    openModal();
  }, [openModal]);

  // Memoize columns — no external callbacks needed
  const columns = useMemo(() => createClientColumns(), []);

  // Table configuration with server-side enabled
  const tableConfig = useMemo(
    () =>
      createTableConfig(ClientesTableConfig, {
        onAdd: canCreateClient ? handleAdd : undefined,
        onClearFilters: handleClearFilters,
        serverSide: {
          enabled: true,
          totalCount,
          pageCount: paginationMeta?.pageCount ?? 0,
        },
      }),
    [
      totalCount,
      paginationMeta?.pageCount,
      canCreateClient,
      handleAdd,
      handleClearFilters,
    ],
  );

  return (
    <Card className="p-2 m-1">
      <CardContent>
        <div className="space-y-6">
          <TablePresentation
            title="Gestion de Clientes"
            subtitle="Administra los clientes de tu organizacion"
          />

          <PermissionGuard
            permissions={[
              PermissionActions.clientes.acceder,
              PermissionActions.clientes.gestionar,
            ]}
          >
            <DataTable
              columns={columns}
              data={clients}
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
              PermissionActions.clientes.crear,
              PermissionActions.clientes.gestionar,
            ]}
          >
            {isOpen && (
              <CreateClientDialog open={isOpen} onClose={closeModal} />
            )}
          </PermissionGuard>
        </div>
      </CardContent>
    </Card>
  );
}
