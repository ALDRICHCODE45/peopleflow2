import type { ColumnDef } from "@tanstack/react-table";
import type { InvoiceDTO } from "../../types/invoice.types";
import {
  InvoiceTypeLabels,
  InvoicePaymentTypeLabels,
  InvoiceStatusLabels,
  FeeTypeLabels,
  invoiceTypeColorMap,
  paymentTypeColorMap,
  statusColorMap,
  INVOICE_PAYMENT_TYPES,
} from "../../types/invoice.types";
import {
  formatInvoiceCurrency,
  formatFeeDisplay,
} from "../../helpers/invoice.helpers";
import { EmptyCell } from "../EmptyCell";
import { InvoiceRowActions } from "./InvoiceRowActions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { cn } from "@/core/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/core/shared/ui/shadcn/tooltip";

// -- Column factory -----------------------------------------------------------

interface CreateInvoiceColumnsOptions {
  onRowClick?: (invoice: InvoiceDTO) => void;
}

export function createInvoiceColumns(
  options?: CreateInvoiceColumnsOptions,
): ColumnDef<InvoiceDTO>[] {
  const { onRowClick } = options ?? {};

  return [
    // ── Folio ──────────────────────────────────────────────
    {
      header: "Folio",
      accessorKey: "folio",
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRowClick?.(invoice);
            }}
            className="font-medium whitespace-nowrap text-left hover:text-primary transition-colors cursor-pointer"
          >
            {invoice.folio}
          </button>
        );
      },
      size: 5,
    },
    // ── Nombre Comercial ──────────────────────────────────
    {
      header: "N. Comercial",
      accessorKey: "nombreComercial",
      cell: ({ row }) => {
        const val = row.original.nombreComercial;
        if (!val) return <EmptyCell />;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block max-w-[140px] truncate text-sm">
                {val}
              </span>
            </TooltipTrigger>
            <TooltipContent>{val}</TooltipContent>
          </Tooltip>
        );
      },
      size: 10,
    },
    // ── Razon Social ──────────────────────────────────────
    {
      header: "Razon Social",
      accessorKey: "razonSocial",
      cell: ({ row }) => {
        const val = row.original.razonSocial;
        if (!val) return <EmptyCell />;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block max-w-[140px] truncate text-sm">
                {val}
              </span>
            </TooltipTrigger>
            <TooltipContent>{val}</TooltipContent>
          </Tooltip>
        );
      },
      size: 10,
    },
    // ── Posicion ──────────────────────────────────────────
    {
      header: "Posicion",
      accessorKey: "posicion",
      cell: ({ row }) => {
        const val = row.original.posicion;
        if (!val) return <EmptyCell />;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block max-w-[140px] truncate text-sm">
                {val}
              </span>
            </TooltipTrigger>
            <TooltipContent>{val}</TooltipContent>
          </Tooltip>
        );
      },
      size: 10,
    },
    // ── Tipo (ANTICIPO / FULL / LIQUIDACION) ──────────────
    {
      header: "Tipo",
      accessorKey: "type",
      cell: ({ row }) => {
        const type = row.original.type;
        const colorClasses =
          invoiceTypeColorMap[type] ??
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
        return (
          <Badge
            className={cn(
              colorClasses,
              "font-medium rounded-sm inline-flex items-center gap-1.5 px-2.5 whitespace-nowrap border-0",
            )}
          >
            <span className="h-[6px] w-[6px] rounded-full bg-current shrink-0" />
            {InvoiceTypeLabels[type] ?? type}
          </Badge>
        );
      },
      size: 6,
      enableSorting: false,
    },
    // ── Sueldo ────────────────────────────────────────────
    {
      header: "Sueldo",
      accessorKey: "salario",
      cell: ({ row }) => {
        const { salario, currency } = row.original;
        if (salario == null) return <EmptyCell />;
        return (
          <span className="whitespace-nowrap text-sm">
            {formatInvoiceCurrency(salario, currency)}
          </span>
        );
      },
      size: 7,
    },
    // ── Fee ───────────────────────────────────────────────
    {
      header: "Fee",
      accessorKey: "feeValue",
      cell: ({ row }) => {
        const { feeType, feeValue } = row.original;
        if (!feeType || feeValue == null) return <EmptyCell />;
        const feeDisplay = formatFeeDisplay(feeType, feeValue);
        const label = FeeTypeLabels[feeType] ?? feeType;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm font-medium whitespace-nowrap">
                {feeDisplay}
              </span>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        );
      },
      size: 5,
      enableSorting: false,
    },
    // ── Subtotal ──────────────────────────────────────────
    {
      header: "Subtotal",
      accessorKey: "subtotal",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm">
          {formatInvoiceCurrency(row.original.subtotal, row.original.currency)}
        </span>
      ),
      size: 7,
    },
    // ── IVA ───────────────────────────────────────────────
    {
      header: "IVA",
      accessorKey: "ivaAmount",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm">
          {formatInvoiceCurrency(row.original.ivaAmount, row.original.currency)}
        </span>
      ),
      size: 6,
    },
    // ── Total ─────────────────────────────────────────────
    {
      header: "Total",
      accessorKey: "total",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm font-bold">
          {formatInvoiceCurrency(row.original.total, row.original.currency)}
        </span>
      ),
      size: 8,
    },
    // ── Tipo Factura (PUE / PPD) ──────────────────────────
    {
      header: "Tipo Factura",
      accessorKey: "paymentType",
      cell: ({ row }) => {
        const pt = row.original.paymentType;
        const colorClasses =
          paymentTypeColorMap[pt] ??
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
        return (
          <Badge
            className={cn(
              colorClasses,
              "font-medium rounded-sm inline-flex items-center gap-1.5 px-2.5 whitespace-nowrap border-0",
            )}
          >
            <span className="h-[6px] w-[6px] rounded-full bg-current shrink-0" />
            {InvoicePaymentTypeLabels[pt]?.split(" - ")[0] ?? pt}
          </Badge>
        );
      },
      size: 5,
      enableSorting: false,
    },
    // ── Status ────────────────────────────────────────────
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.original.status;
        const colorClasses =
          statusColorMap[status] ??
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
        return (
          <Badge
            className={cn(
              colorClasses,
              "font-medium rounded-sm inline-flex items-center gap-1.5 px-2.5 whitespace-nowrap border-0",
            )}
          >
            <span className="h-[6px] w-[6px] rounded-full bg-current shrink-0" />
            {InvoiceStatusLabels[status] ?? status}
          </Badge>
        );
      },
      size: 7,
      enableSorting: false,
    },
    // ── Fecha Emision ─────────────────────────────────────
    {
      header: "Fecha Emision",
      accessorKey: "issuedAt",
      cell: ({ row }) => {
        const dateStr = row.original.issuedAt;
        if (!dateStr) return <EmptyCell />;
        return (
          <span className="whitespace-nowrap text-sm">
            {format(new Date(dateStr), "d MMM yyyy", { locale: es })}
          </span>
        );
      },
      size: 7,
    },
    // ── Fecha Pago ────────────────────────────────────────
    {
      header: "Fecha Pago",
      accessorKey: "paymentDate",
      cell: ({ row }) => {
        const dateStr = row.original.paymentDate;
        if (!dateStr) return <EmptyCell />;
        return (
          <span className="whitespace-nowrap text-sm">
            {format(new Date(dateStr), "d MMM yyyy", { locale: es })}
          </span>
        );
      },
      size: 7,
    },
    // ── Hunter ────────────────────────────────────────────
    {
      header: "Hunter",
      accessorKey: "hunterName",
      cell: ({ row }) => {
        const val = row.original.hunterName;
        if (!val) return <EmptyCell />;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block max-w-[120px] truncate text-sm">
                {val}
              </span>
            </TooltipTrigger>
            <TooltipContent>{val}</TooltipContent>
          </Tooltip>
        );
      },
      size: 8,
      enableSorting: false,
    },
    // ── Candidato ─────────────────────────────────────────
    {
      header: "Candidato",
      accessorKey: "candidateName",
      cell: ({ row }) => {
        const val = row.original.candidateName;
        if (!val) return <EmptyCell />;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block max-w-[120px] truncate text-sm">
                {val}
              </span>
            </TooltipTrigger>
            <TooltipContent>{val}</TooltipContent>
          </Tooltip>
        );
      },
      size: 8,
      enableSorting: false,
    },
    // ── Hidden by default columns ─────────────────────────
    {
      header: "RFC",
      accessorKey: "rfc",
      cell: ({ row }) => {
        const val = row.original.rfc;
        if (!val) return <EmptyCell />;
        return <span className="text-sm whitespace-nowrap">{val}</span>;
      },
      size: 7,
      enableSorting: false,
    },
    {
      header: "CP",
      accessorKey: "codigoPostal",
      cell: ({ row }) => {
        const val = row.original.codigoPostal;
        if (!val) return <EmptyCell />;
        return <span className="text-sm whitespace-nowrap">{val}</span>;
      },
      size: 4,
      enableSorting: false,
    },
    {
      header: "Ubicacion",
      accessorKey: "ubicacion",
      cell: ({ row }) => {
        const val = row.original.ubicacion;
        if (!val) return <EmptyCell />;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block max-w-[120px] truncate text-sm">
                {val}
              </span>
            </TooltipTrigger>
            <TooltipContent>{val}</TooltipContent>
          </Tooltip>
        );
      },
      size: 7,
      enableSorting: false,
    },
    {
      header: "Figura",
      accessorKey: "figura",
      cell: ({ row }) => {
        const val = row.original.figura;
        if (!val) return <EmptyCell />;
        return <span className="text-sm">{val}</span>;
      },
      size: 5,
      enableSorting: false,
    },
    {
      header: "Regimen",
      accessorKey: "regimen",
      cell: ({ row }) => {
        const val = row.original.regimen;
        if (!val) return <EmptyCell />;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block max-w-[120px] truncate text-sm">
                {val}
              </span>
            </TooltipTrigger>
            <TooltipContent>{val}</TooltipContent>
          </Tooltip>
        );
      },
      size: 7,
      enableSorting: false,
    },
    {
      header: "Banco",
      accessorKey: "banco",
      cell: ({ row }) => {
        const val = row.original.banco;
        if (!val) return <EmptyCell />;
        return <span className="text-sm">{val}</span>;
      },
      size: 6,
      enableSorting: false,
    },
    {
      header: "Mes Placement",
      accessorKey: "mesPlacement",
      cell: ({ row }) => {
        const dateStr = row.original.mesPlacement;
        if (!dateStr) return <EmptyCell />;
        return (
          <span className="whitespace-nowrap text-sm">
            {format(new Date(dateStr), "MMM yyyy", { locale: es })}
          </span>
        );
      },
      size: 6,
      enableSorting: false,
    },
    // ── Complemento ─────────────────────────────────────
    {
      header: "Complemento",
      accessorKey: "hasComplemento",
      cell: ({ row }) => {
        const invoice = row.original;
        if (invoice.paymentType !== INVOICE_PAYMENT_TYPES.PPD) return <EmptyCell />;
        if (!invoice.complemento) {
          return (
            <Badge
              className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-medium rounded-sm border-0"
            >
              Pendiente
            </Badge>
          );
        }
        return (
          <a
            href={invoice.complemento.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Badge
              className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 font-medium rounded-sm border-0"
            >
              Ver PDF
            </Badge>
          </a>
        );
      },
      size: 6,
      enableSorting: false,
    },
    // ── Acciones ──────────────────────────────────────────
    {
      id: "actions",
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => <InvoiceRowActions row={row} />,
      size: 5,
      enableHiding: false,
      enableSorting: false,
    },
  ];
}

/**
 * Default column visibility — hide fiscal/metadata columns by default.
 * Users can toggle them via the column visibility dropdown.
 */
export const defaultInvoiceColumnVisibility: Record<string, boolean> = {
  rfc: false,
  codigoPostal: false,
  ubicacion: false,
  figura: false,
  regimen: false,
  banco: false,
  mesPlacement: false,
  hasComplemento: false,
};
