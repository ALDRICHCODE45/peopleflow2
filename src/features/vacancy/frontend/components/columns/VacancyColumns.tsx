import { ColumnDef } from "@tanstack/react-table";
import { Vacancy } from "../../types/vacancy.types";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { VacancyRowActions } from "./VacancyRowActions";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      const fechaFormateada = format(date, "eee d MMM yyyy", { locale: es });

      return (
        <>
          <div className="flex justify-between items-center text-center">
            {fechaFormateada}
          </div>
        </>
      );
    },
    size: 20,
  },

  {
    header: "Actualizado",
    accessorKey: "updatedAt",
    cell: ({ row }) => {
      const date = row.getValue("updatedAt") as Date;
      const fechaFormateada = format(date, "eee d MMM yyyy", { locale: es });

      return (
        <>
          <div className="flex justify-between items-center text-center">
            {fechaFormateada}
          </div>
        </>
      );
    },
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
