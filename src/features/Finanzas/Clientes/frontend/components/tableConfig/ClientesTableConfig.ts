import { TableConfig } from "@/core/shared/components/DataTable/TableTypes.types";
import type { ClientDTO } from "../../types/client.types";
import { ClientesTableFilters } from "./ClientesTableFilters";

export const ClientesTableConfig: TableConfig<ClientDTO> = {
  filters: {
    customFilter: {
      component: ClientesTableFilters,
      props: {
        showAddButton: false,
      },
    },
    searchColumn: "nombre",
    searchPlaceholder: "Buscar clientes...",
    showSearch: true,
  },
  actions: {
    showAddButton: false,
    showBulkActions: false,
  },
  emptyStateMessage: "No se encontraron clientes",
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
    persistKey: "clients-table",
  },
  columnOrder: {
    enabled: true,
    persistKey: "clients-table",
  },
};
