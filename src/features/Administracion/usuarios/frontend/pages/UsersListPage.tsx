"use client";

import { useState, useMemo, useCallback } from "react";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { DataTable } from "@/core/shared/components/DataTable/DataTable";
import { createTableConfig } from "@/core/shared/helpers/createTableConfig";
import { usePaginatedUsersQuery } from "../hooks/usePaginatedUsersQuery";
import { UserColumns } from "../components/UserColumns";
import { UserSheetForm } from "../components/UserSheetForm";
import { UsersTableConfig } from "../tableConfig/UsersTableConfig";
import { useDebouncedValue } from "@/core/shared/hooks/useDebouncedValue";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";

export function UsersListPage() {
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
  const { data, isLoading, isFetching } = usePaginatedUsersQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
    globalFilter: debouncedSearch || undefined,
  });

  // Extraer datos de la respuesta paginada
  const users = data?.data ?? [];
  const paginationMeta = data?.pagination;

  // Handler para cambio de globalFilter - resetea a página 0
  const handleGlobalFilterChange = useCallback((value: string) => {
    setGlobalFilter(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  // Configuración de la tabla con server-side habilitado
  const tableConfig = useMemo(
    () =>
      createTableConfig(UsersTableConfig, {
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
            subtitle="Administra los usuarios de tu organizacion"
            title="Gestion de Usuarios"
          />

          <DataTable
            columns={UserColumns}
            data={users}
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

          {/* Sheet para crear usuario */}
          <UserSheetForm open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </div>
      </CardContent>
    </Card>
  );
}
