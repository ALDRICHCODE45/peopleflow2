import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { TableConfig } from "@/core/shared/components/DataTable/TableTypes.types";
import type { InvoiceDTO } from "../../types/invoice.types";
import { InvoicesTableFilters } from "./InvoicesTableFilters";

export const InvoicesTableConfig: TableConfig<InvoiceDTO> = {
  filters: {
    customFilter: {
      component: InvoicesTableFilters,
      props: {
        addButtonText: "Crear Factura",
        addButtonIcon: PlusSignIcon,
        showAddButton: true,
      },
    },
    searchColumn: "folio",
    searchPlaceholder: "Buscar facturas...",
    showSearch: true,
  },
  actions: {
    showAddButton: true,
    addButtonText: "Crear Factura",
    showBulkActions: false,
  },
  emptyStateMessage: "No se encontraron facturas",
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
    showPageSizeSelector: true,
    showPaginationInfo: true,
  },
  enableColumnVisibility: true,
  enableRowSelection: false,
  enableSorting: true,
  columnPinning: {
    enabled: true,
    persistKey: "invoices-table",
  },
  columnOrder: {
    enabled: true,
    persistKey: "invoices-table",
  },
};
