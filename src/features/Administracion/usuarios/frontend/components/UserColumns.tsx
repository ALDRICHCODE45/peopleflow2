"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/shared/ui/shadcn/avatar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { TenantUser } from "../types";
import { UserRowActions } from "./UserRowActions";

export const UserColumns: ColumnDef<TenantUser>[] = [
  {
    header: "Usuario",
    accessorKey: "name",
    cell: ({ row }) => {
      const user = row.original;
      const initials = user.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : user.email[0].toUpperCase();

      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-8 flex-shrink-0">
            <AvatarImage
              src={user.avatar ?? undefined}
              alt={user.name ?? undefined}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">
              {user.name || "Sin nombre"}
            </p>
            <span className="text-muted-foreground text-xs truncate block">
              {user.email}
            </span>
          </div>
        </div>
      );
    },
    size: 35,
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
    size: 25,
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
    size: 10,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Acciones</span>,
    cell: ({ row }) => <UserRowActions user={row.original} />,
    size: 5,
    enableHiding: false,
  },
];
