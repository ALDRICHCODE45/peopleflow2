import { Add01Icon } from "@hugeicons/core-free-icons";

import { TableConfig } from "@/core/shared/components/DataTable/TableTypes.types";
import { Vacancy } from "../../types/vacancy.types";
import { HugeiconsIcon } from "@hugeicons/react";

export const VacanciesTableConfig: TableConfig<Vacancy> = {
  filters: {
    searchColumn: "title",
    searchPlaceholder: "Buscar vacantes...",
    showSearch: true,
  },
  actions: {
    showAddButton: true,
    addButtonIcon: <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />,
    addButtonText: "Agregar Vacante",
    showBulkActions: true,
    onBulkDelete: (selectedRows) => {
      console.log("Eliminar vacantes:", selectedRows);
    },
    onBulkExport: (selectedRows) => {
      console.log("Exportar vacantes:", selectedRows);
    },
  },
  emptyStateMessage: "No se encontraron vacantes",
  pagination: {
    defaultPageSize: 7,
    pageSizeOptions: [5, 7, 10, 15, 20],
    showPageSizeSelector: true,
    showPaginationInfo: true,
  },
  enableColumnVisibility: false,
  enableRowSelection: true,
  enableSorting: true,
};
