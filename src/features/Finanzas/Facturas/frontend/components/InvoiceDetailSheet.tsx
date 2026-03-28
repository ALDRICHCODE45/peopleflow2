"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@shadcn/sheet";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { Separator } from "@/core/shared/ui/shadcn/separator";
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@shadcn/item";
import { Button } from "@/core/shared/ui/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/core/shared/ui/shadcn/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Download01Icon,
  Link04Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import { InfoItem } from "./InfoItem";
import {
  formatInvoiceCurrency,
  formatFeeDisplay,
  formatDateSafe,
  formatMonthSafe,
  formatFileSize,
} from "../helpers/invoice.helpers";
import {
  InvoiceTypeLabels,
  InvoicePaymentTypeLabels,
  InvoiceStatusLabels,
  FeeTypeLabels,
  CurrencyLabels,
  invoiceTypeColorMap,
  INVOICE_TYPES,
  INVOICE_PAYMENT_TYPES,
  INVOICE_STATUSES,
} from "../types/invoice.types";
import type { InvoiceDetailSheetProps } from "../types/invoice.types";

export function InvoiceDetailSheet({
  invoice,
  open,
  onOpenChange,
}: InvoiceDetailSheetProps) {
  const isMobile = useIsMobile();
  const sheetSide = isMobile ? "bottom" : "right";

  if (!invoice) return null;

  const isAnticipo = invoice.type === INVOICE_TYPES.ANTICIPO;
  const isLiquidacion = invoice.type === INVOICE_TYPES.LIQUIDACION;
  const isFull = invoice.type === INVOICE_TYPES.FULL;
  const isPPD = invoice.paymentType === INVOICE_PAYMENT_TYPES.PPD;
  const isPagada = invoice.status === INVOICE_STATUSES.PAGADA;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        width="2xl"
        side={sheetSide}
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B] overflow-y-auto p-0"
      >
        {/* Header */}
        <SheetHeader className="p-4 pb-3 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl font-semibold">
                Factura {invoice.folio}
              </SheetTitle>
            </div>
            <div className="flex flex-wrap gap-2 sm:mr-4">
              <Badge
                variant={isPagada ? "default" : "outline"}
                className={
                  isPagada
                    ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                    : "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800"
                }
              >
                {InvoiceStatusLabels[invoice.status] ?? invoice.status}
              </Badge>
              <Badge
                className={
                  invoiceTypeColorMap[invoice.type] ??
                  "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }
              >
                {InvoiceTypeLabels[invoice.type] ?? invoice.type}
              </Badge>
              <Badge variant="outline">
                {InvoicePaymentTypeLabels[invoice.paymentType]?.split(
                  " - ",
                )[0] ?? invoice.paymentType}
              </Badge>
            </div>
          </div>

          {/* Client info in header */}
          {invoice.clientName && (
            <p className="text-sm text-muted-foreground">
              {invoice.clientName}
            </p>
          )}
        </SheetHeader>

        <Separator />

        {/* Main Info Section */}
        <section className="p-4 space-y-4">
          {/* Cliente */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Cliente
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem
                label="Nombre Comercial"
                value={invoice.nombreComercial}
              />
              <InfoItem label="Razón Social" value={invoice.razonSocial} />
            </div>
          </div>

          <Separator />

          {/* Datos Fiscales */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Datos Fiscales
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem label="RFC" value={invoice.rfc} />
              <InfoItem label="Código Postal" value={invoice.codigoPostal} />
              <InfoItem label="Régimen Fiscal" value={invoice.regimen} />
              <InfoItem label="Figura" value={invoice.figura} />
              <InfoItem label="Ubicación" value={invoice.ubicacion} />
            </div>
          </div>

          <Separator />

          {/* Vacante y Candidato */}
          {(isFull || isLiquidacion) && (
            <>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Vacante
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem label="Posición" value={invoice.posicion} />
                  <InfoItem
                    label="Mes de Placement"
                    value={formatMonthSafe(invoice.mesPlacement)}
                  />
                  <InfoItem label="Candidato" value={invoice.candidateName} />
                  <InfoItem
                    label="Hunter / Reclutador"
                    value={invoice.hunterName}
                  />
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Liquidacion — Anticipo vinculado */}
          {isLiquidacion && invoice.anticipoFolio && (
            <>
              <div className="rounded-lg border-l-4 border-l-blue-500 border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/10 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={Link04Icon}
                    size={16}
                    className="text-blue-600 dark:text-blue-400"
                  />
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                    Anticipo Vinculado
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Folio Anticipo
                    </p>
                    <p className="text-sm font-semibold">
                      {invoice.anticipoFolio}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Monto Deducido
                    </p>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                      {formatInvoiceCurrency(
                        invoice.anticipoDeduccion,
                        invoice.currency,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Datos Financieros */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Datos Financieros
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem
                label="Moneda"
                value={CurrencyLabels[invoice.currency] ?? invoice.currency}
              />
              {!isAnticipo && (
                <>
                  <InfoItem
                    label="Sueldo"
                    value={
                      invoice.salario != null
                        ? formatInvoiceCurrency(
                            invoice.salario,
                            invoice.currency,
                          )
                        : null
                    }
                  />
                  <InfoItem
                    label="Tipo de Fee"
                    value={
                      invoice.feeType
                        ? (FeeTypeLabels[invoice.feeType] ?? invoice.feeType)
                        : null
                    }
                  />
                  <InfoItem
                    label="Valor del Fee"
                    value={formatFeeDisplay(invoice.feeType, invoice.feeValue)}
                  />
                </>
              )}
              <InfoItem label="Banco" value={invoice.banco} />
            </div>
          </div>

          <Separator />

          {/* Totales */}
          <div className="rounded-lg border-l-4 border-l-primary border border-border bg-muted/20 p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Totales
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  {formatInvoiceCurrency(invoice.subtotal, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  IVA ({(invoice.ivaRate * 100).toFixed(0)}%)
                </span>
                <span className="font-medium">
                  {formatInvoiceCurrency(invoice.ivaAmount, invoice.currency)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">
                  {formatInvoiceCurrency(invoice.total, invoice.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="pt-3 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Fecha de Emisión
                </p>
                <p className="text-sm mt-0.5">
                  {formatDateSafe(invoice.issuedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Fecha de Pago
                </p>
                <p className="text-sm mt-0.5">
                  {formatDateSafe(invoice.paymentDate) || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* PPD Complemento — Item pattern matching Vacantes AttachmentRow */}
          {isPPD && (
            <div className="pt-3 border-t">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Complemento de Pago (PPD)
              </h4>
              {invoice.complemento ? (
                /* eslint-disable @next/next/no-img-element */
                <Item variant="outline" size="sm" className="group">
                  <ItemMedia className="size-9 shrink-0 self-start">
                    <img
                      src="/icons/pdf.svg"
                      alt="PDF"
                      className="size-9 object-contain"
                    />
                  </ItemMedia>

                  <ItemContent>
                    <ItemTitle>
                      <span className="truncate">
                        {invoice.complemento.fileName}
                      </span>
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1">
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={11} />
                        Adjunto
                      </Badge>
                    </ItemTitle>

                    <ItemDescription>
                      {formatFileSize(invoice.complemento.fileSize)}
                      {" · "}
                      Subido el {formatDateSafe(invoice.complemento.createdAt)}
                    </ItemDescription>
                  </ItemContent>

                  <ItemActions className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          asChild
                        >
                          <a
                            href={invoice.complemento.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <HugeiconsIcon icon={Download01Icon} size={15} />
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Descargar</TooltipContent>
                    </Tooltip>
                  </ItemActions>
                </Item>
              ) : (
                /* eslint-enable @next/next/no-img-element */
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/10 p-4">
                  <HugeiconsIcon
                    icon={Alert02Icon}
                    size={20}
                    className="text-amber-500 dark:text-amber-400 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      Complemento pendiente
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Requiere complemento de pago antes de marcar como pagada
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audit */}
          <div className="pt-3 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Creado
                </p>
                <p className="text-sm mt-0.5">
                  {format(new Date(invoice.createdAt), "d MMM yyyy", {
                    locale: es,
                  })}
                </p>
                {invoice.createdByName && (
                  <p className="text-xs text-muted-foreground">
                    por {invoice.createdByName}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Actualizado
                </p>
                <p className="text-sm mt-0.5">
                  {format(new Date(invoice.updatedAt), "d MMM yyyy", {
                    locale: es,
                  })}
                </p>
              </div>
            </div>
          </div>
        </section>
      </SheetContent>
    </Sheet>
  );
}
