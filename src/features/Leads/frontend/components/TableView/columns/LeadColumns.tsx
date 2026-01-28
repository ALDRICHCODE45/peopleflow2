import { ColumnDef } from "@tanstack/react-table";
import type { Lead } from "../../../types";
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
        <div className="flex flex-col min-w-0 w-full overflow-hidden">
          <p className="font-medium truncate">{lead.companyName}</p>
          {lead.rfc && (
            <p className="text-xs text-muted-foreground truncate">{lead.rfc}</p>
          )}
        </div>
      );
    },
    size: 22,
  },
  {
    header: "Estado",
    accessorKey: "status",
    cell: ({ row }) => <LeadStatusBadge status={row.original.status} />,
    size: 24,
  },
  {
    header: "Sector",
    accessorKey: "sectorName",
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <div className="flex flex-col min-w-0 overflow-hidden">
          <span className="truncate">{lead.sectorName || "-"}</span>
          {lead.subsectorName && (
            <span className="text-xs text-muted-foreground truncate">
              {lead.subsectorName}
            </span>
          )}
        </div>
      );
    },
    size: 25,
  },
  {
    header: "Origen",
    accessorKey: "originName",
    cell: ({ row }) => (
      <span className="truncate block">{row.original.originName || "-"}</span>
    ),
    size: 11,
  },
  {
    header: "Asignado",
    accessorKey: "assignedToName",
    cell: ({ row }) => (
      <span className="truncate block">
        {row.original.assignedToName || "-"}
      </span>
    ),
    size: 14,
  },
  {
    header: "Contactos",
    accessorKey: "contactsCount",
    cell: ({ row }) => {
      const count = row.original.contactsCount ?? 0;
      return (
        <Badge variant="outline" className="font-normal whitespace-nowrap">
          {count} {count === 1 ? "contacto" : "contactos"}
        </Badge>
      );
    },
    size: 8,
  },
  {
    header: "Creación",
    accessorKey: "createdAt",
    cell: ({ row }) => {
      const dateStr = row.getValue("createdAt") as string;
      const date = new Date(dateStr);
      return (
        <span className="whitespace-nowrap">
          {format(date, "d MMM yyyy", { locale: es })}
        </span>
      );
    },
    size: 11,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Acciones</span>,
    cell: ({ row }) => <LeadRowActions row={row} />,
    size: 4,
    enableHiding: false,
  },
];
