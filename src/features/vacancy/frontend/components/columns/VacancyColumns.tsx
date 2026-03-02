import { ColumnDef } from "@tanstack/react-table";
import type { VacancyDTO } from "../../types/vacancy.types";
import { VacancyStatusBadge, VacancyModalityBadge } from "../VacancyStatusBadge";
import { VacancyRowActions } from "./VacancyRowActions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Checkbox } from "@/core/shared/ui/shadcn/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/shared/ui/shadcn/avatar";
import { VacancySalesTypeBadge } from "../VacancyVentaTypeBadge";

export function createVacancyColumns(
  onViewDetail?: (id: string) => void,
): ColumnDef<VacancyDTO>[] {
  return [
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
      header: "Posición",
      accessorKey: "position",
      cell: ({ row }) => (
        <span className="font-medium truncate block max-w-50">
          {row.original.position}
        </span>
      ),
      size: 22,
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: ({ row }) => <VacancyStatusBadge status={row.original.status} />,
      size: 16,
      enableSorting: false,
    },
    {
      header: "Cliente",
      accessorKey: "clientName",
      cell: ({ row }) => {
        const { clientName, clientId } = row.original;
        return (
          <span className="truncate block max-w-37.5">
            {clientName ?? clientId}
          </span>
        );
      },
      size: 14,
      enableSorting: false,
    },
    {
      header: "Recruiter",
      accessorKey: "recruiterName",
      cell: ({ row }) => {
        const { recruiterName, recruiterEmail, recruiterAvatar, recruiterId } = row.original;
        const name = recruiterName ?? recruiterId;
        const initials = name
          ? name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
          : "?";
        return (
          <div className="flex items-center gap-3 max-w-[200px]">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={recruiterAvatar ?? undefined} alt={name} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm truncate">{name}</div>
              {recruiterEmail && (
                <span className="text-muted-foreground text-xs truncate block">
                  {recruiterEmail}
                </span>
              )}
            </div>
          </div>
        );
      },
      size: 16,
      enableSorting: false,
    },
    {
      header: "Modalidad",
      accessorKey: "modality",
      cell: ({ row }) => {
        const modality = row.original.modality;
        if (!modality)
          return <span className="text-muted-foreground italic text-xs">—</span>;
        return <VacancyModalityBadge modality={modality} />;
      },
      size: 10,
      enableSorting: false,
    },
    {
      header: "Tipo Venta",
      accessorKey: "saleType",
      cell: ({ row }) => {
        const saleType = row.original.saleType;
        return <VacancySalesTypeBadge type={saleType} />;
      },
      size: 10,
      enableSorting: false,
    },
    {
      header: "Asignación",
      accessorKey: "assignedAt",
      cell: ({ row }) => {
        const dateStr = row.original.assignedAt;
        const date = new Date(dateStr);
        return (
          <span className="whitespace-nowrap text-sm">
            {format(date, "d MMM yyyy", { locale: es })}
          </span>
        );
      },
      size: 12,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => (
        <VacancyRowActions row={row} onViewDetail={onViewDetail} />
      ),
      size: 4,
      enableHiding: false,
      enableSorting: false,
    },
  ];
}

/** Backward-compat export: columns without detail handler */
export const VacancyColumns: ColumnDef<VacancyDTO>[] = createVacancyColumns();
