import { ColumnDef } from "@tanstack/react-table";
import type { ClientDTO } from "../../types/client.types";
import {
  CurrencyLabels,
  PaymentSchemeLabels,
  FeeTypeLabels,
} from "../../types/client.types";
import { ClientRowActions } from "./ClientRowActions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/core/shared/ui/shadcn/badge";

export const ClientColumns: ColumnDef<ClientDTO>[] = [
  {
    header: "Nombre",
    accessorKey: "nombre",
    cell: ({ row }) => {
      return (
        <span className="font-medium truncate">{row.original.nombre}</span>
      );
    },
    size: 20,
  },
  {
    header: "Moneda",
    accessorKey: "currency",
    cell: ({ row }) => {
      const currency = row.original.currency;
      if (!currency) return <span className="text-muted-foreground">—</span>;
      return (
        <Badge variant="outline" className="font-normal whitespace-nowrap">
          {CurrencyLabels[currency] ?? currency}
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
      if (!scheme) return <span className="text-muted-foreground">—</span>;
      return (
        <Badge variant="secondary" className="font-normal whitespace-nowrap">
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
      if (!feeType || feeValue == null)
        return <span className="text-muted-foreground">—</span>;

      const label = FeeTypeLabels[feeType] ?? feeType;
      const displayValue =
        feeType === "PERCENTAGE" ? `${feeValue}%` : `$${feeValue.toLocaleString()}`;

      return (
        <div className="flex flex-col min-w-0 overflow-hidden">
          <span className="truncate text-sm">{displayValue}</span>
          <span className="text-xs text-muted-foreground truncate">
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
      if (days == null) return <span className="text-muted-foreground">—</span>;
      return <span>{days}</span>;
    },
    size: 8,
  },
  {
    header: "Garantía",
    accessorKey: "warrantyMonths",
    cell: ({ row }) => {
      const months = row.original.warrantyMonths;
      if (months == null)
        return <span className="text-muted-foreground">—</span>;
      return (
        <span className="whitespace-nowrap">
          {months} {months === 1 ? "mes" : "meses"}
        </span>
      );
    },
    size: 8,
    enableSorting: false,
  },
  {
    header: "Generador",
    accessorKey: "generadorName",
    cell: ({ row }) => {
      const name = row.original.generadorName;
      if (!name) return <span className="text-muted-foreground">—</span>;
      return <span className="truncate">{name}</span>;
    },
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
    cell: ({ row }) => <ClientRowActions row={row} />,
    size: 4,
    enableHiding: false,
  },
];
