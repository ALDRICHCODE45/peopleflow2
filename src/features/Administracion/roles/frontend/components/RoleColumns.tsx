"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { RoleWithStats } from "../types";
import { RoleRowActions } from "./RoleRowActions";

export const RoleColumns: ColumnDef<RoleWithStats>[] = [
  {
    header: "Nombre",
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="font-medium capitalize">{row.original.name}</div>
    ),
    size: 30,
  },
  {
    header: "Permisos",
    accessorKey: "permissionsCount",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.permissionsCount}</Badge>
    ),
    size: 20,
  },
  {
    header: "Usuarios",
    accessorKey: "usersCount",
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.usersCount}</Badge>
    ),
    size: 20,
  },
  {
    header: "Creación",
    accessorKey: "createdAt",
    cell: ({ row }) => {
      const date = row.original.createdAt;
      const formattedDate = format(new Date(date), "d MMM yyyy", { locale: es });
      return <div className="text-muted-foreground">{formattedDate}</div>;
    },
    size: 20,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Acciones</span>,
    cell: ({ row }) => <RoleRowActions role={row.original} />,
    size: 10,
    enableHiding: false,
  },
];
