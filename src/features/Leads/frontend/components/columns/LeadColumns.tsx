import { ColumnDef } from "@tanstack/react-table";
import type { Lead } from "../../types";
import { LeadStatusBadge } from "../LeadStatusBadge";
import { LeadRowActions } from "./LeadRowActions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/core/shared/ui/shadcn/badge";

export const LeadColumns: ColumnDef<Lead>[] = [
  {
    header: "Empresa",
    accessorKey: "companyName",
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{lead.companyName}</span>
          {lead.rfc && (
            <span className="text-xs text-muted-foreground">{lead.rfc}</span>
          )}
        </div>
      );
    },
    size: 200,
  },
  {
    header: "Estado",
    accessorKey: "status",
    cell: ({ row }) => <LeadStatusBadge status={row.original.status} />,
    size: 150,
  },
  {
    header: "Sector",
    accessorKey: "sectorName",
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <div className="flex flex-col">
          <span>{lead.sectorName || "-"}</span>
          {lead.subsectorName && (
            <span className="text-xs text-muted-foreground">
              {lead.subsectorName}
            </span>
          )}
        </div>
      );
    },
    size: 150,
  },
  {
    header: "Origen",
    accessorKey: "originName",
    cell: ({ row }) => row.original.originName || "-",
    size: 120,
  },
  {
    header: "Asignado",
    accessorKey: "assignedToName",
    cell: ({ row }) => row.original.assignedToName || "-",
    size: 120,
  },
  {
    header: "Contactos",
    accessorKey: "contactsCount",
    cell: ({ row }) => {
      const count = row.original.contactsCount ?? 0;
      return (
        <Badge variant="outline" className="font-normal">
          {count} {count === 1 ? "contacto" : "contactos"}
        </Badge>
      );
    },
    size: 100,
  },
  {
    header: "Creación",
    accessorKey: "createdAt",
    cell: ({ row }) => {
      const dateStr = row.getValue("createdAt") as string;
      const date = new Date(dateStr);
      return format(date, "d MMM yyyy", { locale: es });
    },
    size: 100,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Acciones</span>,
    cell: ({ row }) => <LeadRowActions row={row} />,
    size: 50,
    enableHiding: false,
  },
];
