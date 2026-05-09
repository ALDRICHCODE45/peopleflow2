import type { ColumnDef } from "@tanstack/react-table";
import type { VacancyDTO } from "../../types/vacancy.types";
import {
  VacancyStatusBadge,
  VacancyModalityBadge,
} from "../VacancyStatusBadge";
import { VacancyProgressIndicator } from "../VacancyProgressIndicator";
import { VacancyRowActions } from "./VacancyRowActions";
import { VacancyNameDetails } from "./VacancyNameDetails";
import { RecruiterReassignPopover } from "./RecruiterReassignPopover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { parseDateOnly } from "../../utils/parseDateOnly";
import { Checkbox } from "@/core/shared/ui/shadcn/checkbox";
import { VacancySalesTypeBadge } from "../VacancyVentaTypeBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/core/shared/ui/shadcn/tooltip";
import { Badge } from "@shadcn/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { usePermissions } from "@/core/shared/hooks/use-permissions";

export function createVacancyColumns(
  onViewDetail?: (id: string) => void,
  onOpenCommitments?: (vacancyId: string) => void,
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
        <VacancyNameDetails row={row} onViewDetail={onViewDetail} />
      ),
      size: 22,
    },
    {
      header: "Cliente",
      accessorKey: "clientName",
      cell: ({ row }) => {
        const { clientName, clientId } = row.original;
        return (
          <Tooltip>
            <TooltipTrigger>
              <span className="truncate block max-w-29">
                {clientName ?? clientId}
              </span>
            </TooltipTrigger>
            <TooltipContent>{clientName}</TooltipContent>
          </Tooltip>
        );
      },
      size: 14,
      enableSorting: false,
    },
    {
      header: "Recruiter",
      accessorKey: "recruiterName",
      cell: ({ row }) => <RecruiterReassignPopover vacancy={row.original} />,
      size: 16,
      enableSorting: false,
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: ({ row }) => <VacancyStatusBadge status={row.original.status} />,
      size: 16,
      enableSorting: false,
    },
    {
      header: "Asignación",
      accessorKey: "assignedAt",
      cell: ({ row }) => {
        const dateStr = row.original.assignedAt;
        const date = parseDateOnly(dateStr);
        return (
          <span className="whitespace-nowrap text-sm">
            {date ? format(date, "d MMM yyyy", { locale: es }) : "-"}
          </span>
        );
      },
      size: 12,
    },
    {
      header: "Fecha Máxima",
      accessorKey: "targetDeliveryDate",
      cell: ({ row }) => {
        const dateStr = row.original.targetDeliveryDate;
        const date = parseDateOnly(dateStr);
        return (
          <span className="whitespace-nowrap text-sm">
            {date ? format(date, "d MMM yyyy", { locale: es }) : "-"}
          </span>
        );
      },
      size: 12,
    },
    {
      id: "progress",
      header: "Progreso",
      cell: ({ row }) => {
        const vacancy = row.original;
        return (
          <VacancyProgressIndicator
            currentCycleStartedAt={vacancy.currentCycleStartedAt}
            targetDeliveryDate={vacancy.targetDeliveryDate}
            actualDeliveryDate={vacancy.actualDeliveryDate}
            status={vacancy.status}
            variant="compact"
          />
        );
      },
      size: 12,
      enableSorting: false,
    },
    {
      header: "Modalidad",
      accessorKey: "modality",
      cell: ({ row }) => {
        const modality = row.original.modality;
        if (!modality)
          return (
            <span className="text-muted-foreground italic text-xs">—</span>
          );
        return <VacancyModalityBadge modality={modality} />;
      },
      size: 10,
      enableSorting: false,
    },
    {
      header: "Tipo",
      accessorKey: "saleType",
      cell: ({ row }) => {
        const saleType = row.original.saleType;
        return <VacancySalesTypeBadge type={saleType} />;
      },
      size: 10,
      enableSorting: false,
    },
    {
      header: "Compromisos",
      accessorKey: "activeCommitmentsCount",
      cell: ({ row }) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { hasAnyPermission, isSuperAdmin } = usePermissions();
        const canAccessCommitments =
          isSuperAdmin ||
          hasAnyPermission([
            PermissionActions.vacantesCompromisos.acceder,
            PermissionActions.vacantesCompromisos.gestionar,
          ]);

        const count = row.original.activeCommitmentsCount ?? 0;
        if (count === 0) return null;

        const badge = (
          <Badge
            variant="outline"
            className="gap-1 text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-300 dark:border-amber-500/50 dark:bg-amber-950/30"
          >
            <HugeiconsIcon icon={Calendar03Icon} size={12} />
            {count}
          </Badge>
        );

        if (!canAccessCommitments || !onOpenCommitments) {
          return (
            <Tooltip>
              <TooltipTrigger>{badge}</TooltipTrigger>
              <TooltipContent>
                {count} compromiso{count > 1 ? "s" : ""} activo
                {count > 1 ? "s" : ""}
              </TooltipContent>
            </Tooltip>
          );
        }

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCommitments(row.original.id);
                }}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                aria-label={`Ver compromisos de ${row.original.position}`}
              >
                {badge}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {count} compromiso{count > 1 ? "s" : ""} activo
              {count > 1 ? "s" : ""} · Click para ver
            </TooltipContent>
          </Tooltip>
        );
      },
      size: 8,
      enableSorting: false,
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

/** Backward-compat export: columns without detail handler or commitments handler */
export const VacancyColumns: ColumnDef<VacancyDTO>[] = createVacancyColumns();
