"use client";

import { useMemo, useCallback, useState } from "react";
import { usePaginatedInvoicesQuery } from "../hooks/usePaginatedInvoicesQuery";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { usePermissions } from "@/core/shared/hooks/use-permissions";
import { DataTable } from "@/core/shared/components/DataTable/DataTable";
import { createInvoiceColumns } from "../components/columns/InvoiceColumns";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { createTableConfig } from "@/core/shared/helpers/createTableConfig";
import { InvoicesTableConfig } from "../components/tableConfig/InvoicesTableConfig";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { useServerPaginatedTable } from "@/core/shared/hooks/useServerPaginatedTable";
import { TablePresentation } from "@/core/shared/components/DataTable/TablePresentation";
import { CreateInvoiceSheet } from "../components/CreateInvoiceSheet";
import { InvoiceDetailSheet } from "../components/InvoiceDetailSheet";
import type { InvoiceDTO } from "../types/invoice.types";
import type { InvoiceStatus, InvoiceType } from "@/core/generated/prisma/client";

export function InvoicesListPage() {
  const { hasAnyPermission, isSuperAdmin } = usePermissions();
  const canCreateInvoice =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.facturas.crear,
      PermissionActions.facturas.gestionar,
    ]);

  // Create dialog at page level (OK per DataTable-Guide Rule 2)
  const { isOpen, openModal, closeModal } = useModalState();

  // Detail sheet state
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDTO | null>(
    null,
  );
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  // Handle row click to open detail sheet
  const handleRowClick = useCallback((invoice: InvoiceDTO) => {
    setSelectedInvoice(invoice);
    setIsDetailSheetOpen(true);
  }, []);

  // Server-side pagination state (no tabs for invoices)
  const {
    pagination,
    sorting,
    debouncedSearch,
    setPagination,
    setSorting,
    handleGlobalFilterChange,
    createPaginationHandler,
  } = useServerPaginatedTable({ initialPageSize: 10 });

  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | undefined>();
  const [typeFilter, setTypeFilter] = useState<InvoiceType | undefined>();
  const [clientFilter, setClientFilter] = useState<string | undefined>();
  const [dateFromFilter, setDateFromFilter] = useState<string | undefined>();
  const [dateToFilter, setDateToFilter] = useState<string | undefined>();

  // Handler to clear all filters
  const handleClearFilters = useCallback(() => {
    handleGlobalFilterChange("");
    setStatusFilter(undefined);
    setTypeFilter(undefined);
    setClientFilter(undefined);
    setDateFromFilter(undefined);
    setDateToFilter(undefined);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [handleGlobalFilterChange, setPagination]);

  // Query with server-side pagination
  const { data, isFetching, isPending } = usePaginatedInvoicesQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
    globalFilter: debouncedSearch || undefined,
    status: statusFilter,
    type: typeFilter,
    clientId: clientFilter,
    dateFrom: dateFromFilter,
    dateTo: dateToFilter,
  });

  // Extract data from paginated response
  const invoices = data?.data ?? [];
  const paginationMeta = data?.pagination;
  const totalCount = paginationMeta?.totalCount ?? 0;

  // Solo mostrar skeleton si es carga inicial SIN datos previos
  const showInitialLoading = isPending && !data;

  const handleAdd = useCallback(() => {
    openModal();
  }, [openModal]);

  // Memoize columns
  const columns = useMemo(
    () => createInvoiceColumns({ onRowClick: handleRowClick }),
    [handleRowClick],
  );

  // Table configuration with server-side enabled
  const tableConfig = useMemo(
    () =>
        createTableConfig(InvoicesTableConfig, {
          onAdd: canCreateInvoice ? handleAdd : undefined,
          onClearFilters: handleClearFilters,
          status: statusFilter,
          type: typeFilter,
          clientId: clientFilter,
          dateFrom: dateFromFilter,
          dateTo: dateToFilter,
          onStatusChange: (value?: InvoiceStatus) => {
            setStatusFilter(value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          },
          onTypeChange: (value?: InvoiceType) => {
            setTypeFilter(value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          },
          onClientChange: (value?: string) => {
            setClientFilter(value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          },
          onDateFromChange: (value?: string) => {
            setDateFromFilter(value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          },
          onDateToChange: (value?: string) => {
            setDateToFilter(value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          },
          serverSide: {
            enabled: true,
            totalCount,
          pageCount: paginationMeta?.pageCount ?? 0,
        },
      }),
    [
      totalCount,
      paginationMeta?.pageCount,
      canCreateInvoice,
      handleAdd,
      handleClearFilters,
      statusFilter,
      typeFilter,
      clientFilter,
      dateFromFilter,
      dateToFilter,
      setPagination,
    ],
  );

  return (
    <Card className="p-2 m-1 overflow-visible">
      <CardContent>
        <div className="space-y-6">
          <TablePresentation
            title="Gestion de Facturas"
            subtitle="Administra las facturas de tu organizacion"
          />

          <PermissionGuard
            permissions={[
              PermissionActions.facturas.acceder,
              PermissionActions.facturas.gestionar,
            ]}
          >
            <DataTable
              columns={columns}
              data={invoices}
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

          {/* Create sheet at page level (OK per DataTable-Guide Rule 2) */}
          <PermissionGuard
            permissions={[
              PermissionActions.facturas.crear,
              PermissionActions.facturas.gestionar,
            ]}
          >
            {isOpen && (
              <CreateInvoiceSheet open={isOpen} onOpenChange={closeModal} />
            )}
          </PermissionGuard>

          {/* Detail Sheet — shown when a row is selected */}
          <InvoiceDetailSheet
            invoice={selectedInvoice}
            open={isDetailSheetOpen}
            onOpenChange={(open) => {
              setIsDetailSheetOpen(open);
              if (!open) setSelectedInvoice(null);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
