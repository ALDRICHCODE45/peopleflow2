"use client";

import { useMemo, useCallback, useState } from "react";
import { usePaginatedClientsQuery } from "../hooks/usePaginatedClientsQuery";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { DataTable } from "@/core/shared/components/DataTable/DataTable";
import { createClientColumns } from "../components/columns/ClientColumns";
import { createTableConfig } from "@/core/shared/helpers/createTableConfig";
import { ClientesTableConfig } from "../components/tableConfig/ClientesTableConfig";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { useServerPaginatedTable } from "@/core/shared/hooks/useServerPaginatedTable";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";
import { ClientSheetForm } from "../components/ClientSheetForm";
import { CreateClientDialog } from "../components/CreateClientDialog";
import { Button } from "@/core/shared/ui/shadcn/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import type { ClientDTO } from "../types/client.types";

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

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Edit sheet state
  const [editingClient, setEditingClient] = useState<ClientDTO | undefined>();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleEdit = useCallback((client: ClientDTO) => {
    setEditingClient(client);
    setSheetOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setEditingClient(undefined);
  }, []);

  // Memoize columns with edit callback
  const columns = useMemo(
    () => createClientColumns(handleEdit),
    [handleEdit],
  );

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
          <div className="flex items-center justify-between">
            <TablePresentation
              title="Gestión de Clientes"
              subtitle="Administra los clientes de tu organización"
            />
            <PermissionGuard
              permissions={[
                PermissionActions.clientes.crear,
                PermissionActions.clientes.gestionar,
              ]}
            >
              <Button onClick={() => setCreateDialogOpen(true)} size="sm">
                <HugeiconsIcon icon={PlusSignIcon} size={16} />
                Nuevo Cliente
              </Button>
            </PermissionGuard>
          </div>

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
        </div>
      </CardContent>

      <ClientSheetForm
        client={editingClient}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
      />

      <CreateClientDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </Card>
  );
}
