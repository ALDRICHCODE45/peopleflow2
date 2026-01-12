// import { PlusCircle, UserPlus } from "lucide-react";
import { Plus, UserPlus } from "@hugeicons/core-free-icons";

import { TableConfig } from "@/core/shared/components/DataTable/TableTypes.types";
import { VacanciesTableFilters } from "./VacanciesTableFilters";
import { Vacancy } from "../../types/vacancy.types";
import { HugeiconsIcon } from "@hugeicons/react";

export const VacanciesTableConfig: TableConfig<Vacancy> = {
  filters: {
    customFilter: {
      component: VacanciesTableFilters,
      props: {
        addButtonIcon: UserPlus,
        addButtonText: "Agregar Socio",
        showAddButton: true,
      },
    },
    searchColumn: "name",
    searchPlaceholder: "Buscar por nombre del Socio",
    showSearch: true,
  },
  actions: {
    showExportButton: true,
    onExport: () => {
      console.log("Exportando Socio");
    },
    showAddButton: true,
    addButtonIcon: <HugeiconsIcon icon={Plus} />,
    addButtonText: "Agregar Socio",
    onAdd: () => {
      console.log("Agregando Socio");
    },
  },
  emptyStateMessage: "No se encontraron Socio",
  pagination: {
    defaultPageSize: 5,
    pageSizeOptions: [5, 10, 15, 20],
    showPageSizeSelector: true,
    showPaginationInfo: true,
  },
  enableColumnVisibility: true,
  enableRowSelection: true,
  enableSorting: true,
};
