"use client";

import { useState, useMemo, useCallback } from "react";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { DataTable } from "@/core/shared/components/DataTable/DataTable";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { createTableConfig } from "@/core/shared/helpers/createTableConfig";
import { usePaginatedRolesQuery } from "../hooks/usePaginatedRolesQuery";
import { RoleColumns } from "../components/RoleColumns";
import { RoleSheetForm } from "../components/RoleSheetForm";
import { RolesTableConfig } from "../tableConfig/RolesTableConfig";
import { useDebouncedValue } from "@/core/shared/hooks/useDebouncedValue";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";

export function RolesListPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Estado para server-side pagination
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Debounce para búsqueda (300ms)
  const debouncedSearch = useDebouncedValue(globalFilter, 300);

  // Query con paginación server-side
  const { data, isLoading, isFetching } = usePaginatedRolesQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
    globalFilter: debouncedSearch || undefined,
  });

  // Extraer datos de la respuesta paginada
  const roles = data?.data ?? [];
  const paginationMeta = data?.pagination;

  // Handler para cambio de globalFilter - resetea a página 0
  const handleGlobalFilterChange = useCallback((value: string) => {
    setGlobalFilter(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  // Configuración de la tabla con server-side habilitado
  const tableConfig = useMemo(
    () =>
      createTableConfig(RolesTableConfig, {
        onAdd: () => setIsCreateOpen(true),
        serverSide: {
          enabled: true,
          totalCount: paginationMeta?.totalCount ?? 0,
          pageCount: paginationMeta?.pageCount ?? 0,
          isLoading,
          isFetching,
        },
      }),
    [paginationMeta, isLoading, isFetching],
  );

  return (
    <Card className="p-2 m-1">
      <CardContent>
        <div className="space-y-6">
          <TablePresentation
            subtitle="Administra los roles y permisos de tu organizacion"
            title="Gestion de roles y permisos"
          />

          <DataTable
            columns={RoleColumns}
            data={roles}
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

          {/* Sheet para crear rol - solo usuarios con permisos*/}
          <PermissionGuard
            permissions={[
              PermissionActions.roles.gestionar,
              PermissionActions.roles.crear,
            ]}
          >
            <RoleSheetForm open={isCreateOpen} onOpenChange={setIsCreateOpen} />
          </PermissionGuard>
        </div>
      </CardContent>
    </Card>
  );
}
