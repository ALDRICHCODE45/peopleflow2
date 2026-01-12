import { ColumnDef } from "@tanstack/react-table";
import { Vacancy } from "../../types/vacancy.types";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { VacancyRowActions } from "./VacancyRowActions";

export const VacancyColumns: ColumnDef<Vacancy>[] = [
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => {
      const value = row.original.status;

      return (
        <>
          <Badge variant="secondary">{value}</Badge>
        </>
      );
    },
    size: 20,
  },
  {
    header: "Titulo",
    accessorKey: "title",
    size: 20,
  },

  {
    header: "Description",
    accessorKey: "description",
    size: 20,
  },
  {
    header: "Departamento",
    accessorKey: "department",
    size: 20,
  },
  {
    header: "Location",
    accessorKey: "location",
    size: 20,
  },
  {
    header: "Creacion",
    accessorKey: "createdAt",
    size: 20,
  },

  {
    header: "Actualizado",
    accessorKey: "updatedAt",
    size: 20,
  },

  {
    id: "actions",
    header: () => <span className="sr-only">Acciones</span>,
    cell: ({ row }) => <VacancyRowActions row={row} />,
    size: 5,
    enableHiding: false,
  },
];
