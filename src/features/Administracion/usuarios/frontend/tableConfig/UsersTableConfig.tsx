import { Add01Icon } from "@hugeicons/core-free-icons";
import { TableConfig } from "@/core/shared/components/DataTable/TableTypes.types";
import type { TenantUser } from "../types";
import { UsersTableFilters } from "./UsersTableFilters";

export const UsersTableConfig: TableConfig<TenantUser> = {
  filters: {
    customFilter: {
      component: UsersTableFilters,
      props: {
        addButtonText: "Crear Usuario",
        addButtonIcon: Add01Icon,
        showAddButton: true,
      },
    },
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
    pageSizeOptions: [5, 10, 20, 50],
    showPageSizeSelector: true,
    showPaginationInfo: true,
  },
  enableColumnVisibility: true,
  enableRowSelection: false,
  enableSorting: true,
};
