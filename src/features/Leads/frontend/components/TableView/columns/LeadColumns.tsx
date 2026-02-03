import { ColumnDef } from "@tanstack/react-table";
import type { Lead } from "../../../types";
import { LeadStatusBadge } from "../LeadStatusBadge";
import { LeadRowActions } from "./LeadRowActions";
import { AsignToUserColumn } from "../AsignToUserColumn";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { Checkbox } from "@/core/shared/ui/shadcn/checkbox";

export const LeadColumns: ColumnDef<Lead>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todas"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
      />
    ),
    size: 2,
    enableSorting: false,
    enableHiding: false,
  },
  {
    header: "Empresa",
    accessorKey: "companyName",
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <div className="flex flex-col min-w-0 w-full overflow-hidden">
          <p className="font-medium truncate">{lead.companyName}</p>
        </div>
      );
    },
    size: 16,
  },
  {
    header: "Estado",
    accessorKey: "status",
    cell: ({ row }) => <LeadStatusBadge status={row.original.status} />,
    size: 22,
  },
  {
    header: "Sector",
    accessorKey: "sectorName",
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <div className="flex flex-col min-w-0 overflow-hidden">
          <span className="truncate">{lead.sectorName || "-"}</span>
          {lead.subsectorName ? (
            <span className="text-xs text-muted-foreground truncate">
              {lead.subsectorName}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground truncate italic">
              No Ingresado.
            </span>
          )}
        </div>
      );
    },
    size: 16,
  },
  {
    header: "Origen",
    accessorKey: "originName",
    cell: ({ row }) => (
      <>
        <div className="flex flex-col min-w-0 overflow-hidden">
          <span className="truncate">{row.original.originName || "-"}</span>
          {row.original.subOrigin ? (
            <span className="text-xs text-muted-foreground truncate">
              {row.original.subOrigin}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground truncate italic">
              No Ingresado.
            </span>
          )}
        </div>
      </>
    ),
    size: 10,
  },
  {
    header: "Asignado",
    accessorKey: "assignedToId",
    cell: ({ row }) => <AsignToUserColumn userId={row.original.assignedToId} />,
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
    size: 10,
  },
  {
    id: "actions",
    cell: ({ row }) => <LeadRowActions row={row} />,
    size: 4,
    enableHiding: false,
  },
];
