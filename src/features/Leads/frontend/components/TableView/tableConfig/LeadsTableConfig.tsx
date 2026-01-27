import { Add01Icon, FilePlus } from "@hugeicons/core-free-icons";
import { TableConfig } from "@/core/shared/components/DataTable/TableTypes.types";
import type { Lead } from "../../../types";
import { HugeiconsIcon } from "@hugeicons/react";
import { LeadsTableFilters } from "./LeadsTableFilters";

export const LeadsTableConfig: TableConfig<Lead> = {
  filters: {
    customFilter: {
      component: LeadsTableFilters,
      props: {
        addButtonText: "Nuevo Lead",
        addButtonIcon: FilePlus,
        showAddButton: true,
      },
    },
    searchColumn: "companyName",
    searchPlaceholder: "Buscar leads...",
    showSearch: true,
  },
  actions: {
    showAddButton: true,
    addButtonIcon: <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />,
    addButtonText: "Nuevo Lead",
    showBulkActions: false,
  },
  emptyStateMessage: "No se encontraron leads",
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [3, 5, 10, 15, 20, 50],
    showPageSizeSelector: true,
    showPaginationInfo: true,
  },
  enableColumnVisibility: false,
  enableRowSelection: false,
  enableSorting: true,
};
