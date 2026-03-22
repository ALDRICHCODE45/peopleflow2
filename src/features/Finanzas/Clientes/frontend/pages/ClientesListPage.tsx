"use client";

import { useMemo, useCallback } from "react";
import { usePaginatedClientsQuery } from "../hooks/usePaginatedClientsQuery";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { DataTable } from "@/core/shared/components/DataTable/DataTable";
import { ClientColumns } from "../components/columns/ClientColumns";
import { createTableConfig } from "@/core/shared/helpers/createTableConfig";
import { ClientesTableConfig } from "../components/tableConfig/ClientesTableConfig";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { useServerPaginatedTable } from "@/core/shared/hooks/useServerPaginatedTable";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";
export function ClientListPage() {
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
  const { data, isFetching, isPending } =
    usePaginatedClientsQuery({
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

  // Table configuration with server-side enabled
  const tableConfig = useMemo(
    () =>
      createTableConfig(ClientesTableConfig, {
        onClearFilters: handleClearFilters,
        serverSide: {
          enabled: true,
          totalCount,
          pageCount: paginationMeta?.pageCount ?? 0,
        },
      }),
    [totalCount, paginationMeta?.pageCount, handleClearFilters],
  );

  return (
    <Card className="p-2 m-1">
      <CardContent>
        <div className="space-y-6">
          <TablePresentation
            title="Gestión de Clientes"
            subtitle="Administra los clientes de tu organización"
          />

          <PermissionGuard
            permissions={[
              PermissionActions.clientes.acceder,
              PermissionActions.clientes.gestionar,
            ]}
          >
            <DataTable
              columns={ClientColumns}
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
        </div>
      </CardContent>
    </Card>
  );
}
