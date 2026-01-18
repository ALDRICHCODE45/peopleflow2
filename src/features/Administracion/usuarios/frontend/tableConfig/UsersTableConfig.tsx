import { TableConfig } from "@/core/shared/components/DataTable/TableTypes.types";
import type { TenantUser } from "../types";

export const UsersTableConfig: TableConfig<TenantUser> = {
  filters: {
    searchColumn: "email",
    searchPlaceholder: "Buscar por email...",
    showSearch: true,
  },
  actions: {
    showAddButton: true,
    addButtonText: "Crear Usuario",
    showBulkActions: false,
  },
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 15, 20],
    showPageSizeSelector: true,
    showPaginationInfo: true,
  },
  enableColumnVisibility: false,
  enableRowSelection: false,
  enableSorting: true,
};
