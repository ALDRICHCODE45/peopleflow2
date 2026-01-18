import { TableConfig } from "@/core/shared/components/DataTable/TableTypes.types";
import type { RoleWithStats } from "../types";

export const RolesTableConfig: TableConfig<RoleWithStats> = {
  filters: {
    searchColumn: "name",
    searchPlaceholder: "Buscar rol...",
    showSearch: true,
  },
  actions: {
    showAddButton: true,
    addButtonText: "Crear Rol",
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
