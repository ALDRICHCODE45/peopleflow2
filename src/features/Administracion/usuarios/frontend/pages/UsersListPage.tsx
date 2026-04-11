"use client";

import { useMemo, useCallback, useState } from "react";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { DataTable } from "@/core/shared/components/DataTable/DataTable";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";
import { createTableConfig } from "@/core/shared/helpers/createTableConfig";
import { useServerPaginatedTable } from "@/core/shared/hooks/useServerPaginatedTable";
import { usePaginatedUsersQuery } from "../hooks/usePaginatedUsersQuery";
import { UserColumns } from "../components/UserColumns";
import { UserSheetForm } from "../components/UserSheetForm";
import { UsersTableConfig } from "../tableConfig/UsersTableConfig";

export function UsersListPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    pagination,
    sorting,
    debouncedSearch,
    setPagination,
    setSorting,
    handleGlobalFilterChange,
    createPaginationHandler,
  } = useServerPaginatedTable({ initialPageSize: 10 });

  const { data, isFetching, isPending } = usePaginatedUsersQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
    globalFilter: debouncedSearch || undefined,
  });

  const users = data?.data ?? [];
  const paginationMeta = data?.pagination;
  const totalCount = paginationMeta?.totalCount ?? 0;
  const showInitialLoading = isPending && !data;

  const handleClearFilters = useCallback(() => {
    handleGlobalFilterChange("");
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [handleGlobalFilterChange, setPagination]);

  const tableConfig = useMemo(
    () =>
      createTableConfig(UsersTableConfig, {
        onAdd: () => setIsCreateOpen(true),
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
            subtitle="Administra los usuarios de tu organizacion"
            title="Gestion de Usuarios"
          />

          <DataTable
            columns={UserColumns}
            data={users}
            config={tableConfig}
            isLoading={showInitialLoading}
            isFetching={isFetching && !showInitialLoading}
            pagination={pagination}
            sorting={sorting}
            onPaginationChange={createPaginationHandler(totalCount)}
            onSortingChange={setSorting}
            onGlobalFilterChange={handleGlobalFilterChange}
          />

          {isCreateOpen && (
            <UserSheetForm open={isCreateOpen} onOpenChange={setIsCreateOpen} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
