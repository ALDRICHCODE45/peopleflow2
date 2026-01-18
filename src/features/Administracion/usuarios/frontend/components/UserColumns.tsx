"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { TenantUser } from "../types";
import { UserRowActions } from "./UserRowActions";

export const UserColumns: ColumnDef<TenantUser>[] = [
  {
    header: "Email",
    accessorKey: "email",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.email}</div>
    ),
    size: 30,
  },
  {
    header: "Nombre",
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {row.original.name || "Sin nombre"}
      </div>
    ),
    size: 25,
  },
  {
    header: "Roles",
    accessorKey: "roles",
    cell: ({ row }) => (
      <div className="flex gap-1 flex-wrap">
        {row.original.roles.map((role) => (
          <Badge key={role.id} variant="secondary">
            {role.name}
          </Badge>
        ))}
        {row.original.roles.length === 0 && (
          <span className="text-muted-foreground text-sm">Sin roles</span>
        )}
      </div>
    ),
    size: 30,
  },
  {
    header: "Creación",
    accessorKey: "createdAt",
    cell: ({ row }) => {
      const date = row.original.createdAt;
      if (!date) return <span className="text-muted-foreground">-</span>;
      const formattedDate = format(new Date(date), "d MMM yyyy", { locale: es });
      return <div className="text-muted-foreground">{formattedDate}</div>;
    },
    size: 15,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Acciones</span>,
    cell: ({ row }) => <UserRowActions user={row.original} />,
    size: 5,
    enableHiding: false,
  },
];
