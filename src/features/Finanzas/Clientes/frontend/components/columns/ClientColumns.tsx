import type { ColumnDef } from "@tanstack/react-table";
import type { ClientDTO } from "../../types/client.types";
import {
  PaymentSchemeLabels,
  FeeTypeLabels,
} from "../../types/client.types";
import { ClientRowActions } from "./ClientRowActions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { cn } from "@/core/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/core/shared/ui/shadcn/tooltip";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/shared/ui/shadcn/avatar";
import { Skeleton } from "@/core/shared/ui/shadcn/skeleton";
import { useUserById } from "@/features/Administracion/usuarios/frontend/hooks/useUserById";

// ── Color maps ───────────────────────────────────────────────────────────────

const currencyColorMap: Record<string, string> = {
  MXN: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  USD: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

const schemeColorMap: Record<string, string> = {
  SUCCESS_100: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  ADVANCE: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

const feeTypeColorMap: Record<string, string> = {
  PERCENTAGE: "text-violet-600 dark:text-violet-400",
  FIXED: "text-teal-600 dark:text-teal-400",
  MONTHS: "text-blue-600 dark:text-blue-400",
};

// ── Null placeholder ─────────────────────────────────────────────────────────

function EmptyCell() {
  return <span className="text-muted-foreground text-xs italic">—</span>;
}

// ── Generador cell (avatar + name + email via useUserById) ───────────────────

function GeneradorCell({ generadorId }: { generadorId: string | null }) {
  const { data: user, isLoading } = useUserById(generadorId);

  if (!generadorId) return <EmptyCell />;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    );
  }

  if (!user) return <EmptyCell />;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <div className="flex items-center gap-2 max-w-[200px]">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="font-medium truncate text-sm">{user.name || "-"}</div>
        <span className="text-muted-foreground text-xs truncate block">
          {user.email}
        </span>
      </div>
    </div>
  );
}

// ── Column factory ───────────────────────────────────────────────────────────

export function createClientColumns(
  onEdit?: (client: ClientDTO) => void,
): ColumnDef<ClientDTO>[] {
  return [
    {
      header: "Nombre",
      accessorKey: "nombre",
      cell: ({ row }) => {
        const nombre = row.original.nombre;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block max-w-[200px] truncate font-medium">
                {nombre}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{nombre}</p>
            </TooltipContent>
          </Tooltip>
        );
      },
      size: 20,
    },
    {
      header: "Moneda",
      accessorKey: "currency",
      cell: ({ row }) => {
        const currency = row.original.currency;
        if (!currency) return <EmptyCell />;
        const colorClasses = currencyColorMap[currency] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
        return (
          <Badge
            className={cn(
              colorClasses,
              "font-medium rounded-sm inline-flex items-center gap-1.5 px-2.5 whitespace-nowrap border-0",
            )}
          >
            <span className="h-[6px] w-[6px] rounded-full bg-current shrink-0" />
            {currency}
          </Badge>
        );
      },
      size: 8,
      enableSorting: false,
    },
    {
      header: "Esquema",
      accessorKey: "paymentScheme",
      cell: ({ row }) => {
        const scheme = row.original.paymentScheme;
        if (!scheme) return <EmptyCell />;
        const colorClasses = schemeColorMap[scheme] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
        return (
          <Badge
            className={cn(
              colorClasses,
              "font-medium rounded-sm inline-flex items-center gap-1.5 px-2.5 whitespace-nowrap border-0",
            )}
          >
            <span className="h-[6px] w-[6px] rounded-full bg-current shrink-0" />
            {PaymentSchemeLabels[scheme] ?? scheme}
          </Badge>
        );
      },
      size: 12,
      enableSorting: false,
    },
    {
      header: "Fee",
      id: "fee",
      cell: ({ row }) => {
        const { feeType, feeValue } = row.original;
        if (!feeType || feeValue == null) return <EmptyCell />;

        const label = FeeTypeLabels[feeType] ?? feeType;
        const displayValue =
          feeType === "PERCENTAGE" ? `${feeValue}%` : `$${feeValue.toLocaleString()}`;
        const typeColor = feeTypeColorMap[feeType] ?? "text-muted-foreground";

        return (
          <div className="flex flex-col min-w-0 overflow-hidden">
            <span className="truncate text-sm font-medium">{displayValue}</span>
            <span className={cn("text-xs truncate font-medium", typeColor)}>
              {label}
            </span>
          </div>
        );
      },
      size: 12,
      enableSorting: false,
    },
    {
      header: "Días Crédito",
      accessorKey: "creditDays",
      cell: ({ row }) => {
        const days = row.original.creditDays;
        if (days == null) return <EmptyCell />;
        return (
          <Badge
            variant="outline"
            className="font-medium whitespace-nowrap"
          >
            {days} {days === 1 ? "día" : "días"}
          </Badge>
        );
      },
      size: 8,
    },
    {
      header: "Garantía",
      accessorKey: "warrantyMonths",
      cell: ({ row }) => {
        const months = row.original.warrantyMonths;
        if (months == null) return <EmptyCell />;
        return (
          <Badge
            variant="info"
            className="font-medium whitespace-nowrap"
          >
            {months} {months === 1 ? "mes" : "meses"}
          </Badge>
        );
      },
      size: 8,
      enableSorting: false,
    },
    {
      header: "Generador",
      accessorKey: "generadorId",
      cell: ({ row }) => (
        <GeneradorCell generadorId={row.original.generadorId} />
      ),
      size: 14,
      enableSorting: false,
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
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => <ClientRowActions row={row} onEdit={onEdit} />,
      size: 4,
      enableHiding: false,
      enableSorting: false,
    },
  ];
}

/** Backward-compat export: columns without edit handler */
export const ClientColumns: ColumnDef<ClientDTO>[] = createClientColumns();
