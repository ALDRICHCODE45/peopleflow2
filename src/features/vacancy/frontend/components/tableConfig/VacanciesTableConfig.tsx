import { Add01Icon, FilePlus } from "@hugeicons/core-free-icons";
import { TableConfig } from "@/core/shared/components/DataTable/TableTypes.types";
import type { VacancyDTO } from "../../types/vacancy.types";
import { HugeiconsIcon } from "@hugeicons/react";
import { VacanciesTableFilters } from "./VacanciesTableFilters";

export const VacanciesTableConfig: TableConfig<VacancyDTO> = {
  filters: {
    customFilter: {
      component: VacanciesTableFilters,
      props: {
        addButtonText: "Agregar Vacante",
        addButtonIcon: FilePlus,
        showAddButton: true,
      },
    },
    searchColumn: "position",
    searchPlaceholder: "Buscar vacantes...",
    showSearch: true,
  },
  actions: {
    showAddButton: true,
    addButtonIcon: <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />,
    addButtonText: "Agregar Vacante",
    showBulkActions: true,
  },
  emptyStateMessage: "No se encontraron vacantes",
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 15, 20, 50],
    showPageSizeSelector: true,
    showPaginationInfo: true,
  },
  enableColumnVisibility: true,
  enableRowSelection: true,
  enableSorting: true,
  columnPinning: {
    enabled: true,
    persistKey: "vacancies-table",
  },
  columnOrder: {
    enabled: true,
    persistKey: "vacancies-table",
  },
};
