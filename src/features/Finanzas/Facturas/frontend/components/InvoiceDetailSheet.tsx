"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@shadcn/sheet";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { Separator } from "@/core/shared/ui/shadcn/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import type { InvoiceDTO } from "../types/invoice.types";
import {
  InvoiceTypeLabels,
  InvoicePaymentTypeLabels,
  InvoiceStatusLabels,
  FeeTypeLabels,
  CurrencyLabels,
} from "../types/invoice.types";

interface InvoiceDetailSheetProps {
  invoice: InvoiceDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDateSafe(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    return format(new Date(isoString), "d MMM yyyy", { locale: es });
  } catch {
    return "—";
  }
}

function formatMonthSafe(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    return format(new Date(isoString), "MMMM yyyy", { locale: es });
  } catch {
    return "—";
  }
}

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatFee(feeType: string | null, feeValue: number | null): string {
  if (!feeType || feeValue == null) return "—";
  switch (feeType) {
    case "PERCENTAGE":
      return `${feeValue}%`;
    case "FIXED":
      return `$${feeValue.toLocaleString("es-MX")}`;
    case "MONTHS":
      return `${feeValue} ${feeValue === 1 ? "mes" : "meses"}`;
    default:
      return String(feeValue);
  }
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) {
    return (
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm mt-0.5 italic">No ingresado</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  );
}

export function InvoiceDetailSheet({
  invoice,
  open,
  onOpenChange,
}: InvoiceDetailSheetProps) {
  const isMobile = useIsMobile();
  const sheetSide = isMobile ? "bottom" : "right";

  if (!invoice) return null;

  const isAnticipo = invoice.type === "ANTICIPO";
  const isLiquidacion = invoice.type === "LIQUIDACION";
  const isFull = invoice.type === "FULL";
  const isPPD = invoice.paymentType === "PPD";
  const isPagada = invoice.status === "PAGADA";

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
            <div className="flex flex-wrap gap-2">
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
                  invoice.type === "ANTICIPO"
                    ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                    : invoice.type === "FULL"
                      ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                      : "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
                }
              >
                {InvoiceTypeLabels[invoice.type] ?? invoice.type}
              </Badge>
              <Badge variant="outline">
                {InvoicePaymentTypeLabels[invoice.paymentType]?.split(" - ")[0] ??
                  invoice.paymentType}
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
              <InfoItem label="Nombre Comercial" value={invoice.nombreComercial} />
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
              <InfoItem
                label="Ubicación"
                value={invoice.ubicacion}
              />
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
                  <InfoItem label="Mes de Placement" value={formatMonthSafe(invoice.mesPlacement)} />
                  <InfoItem label="Candidato" value={invoice.candidateName} />
                  <InfoItem label="Hunter / Reclutador" value={invoice.hunterName} />
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Liquidacion info */}
          {isLiquidacion && invoice.anticipoFolio && (
            <>
              <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                  Liquidación - Anticipo Vinculado
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Folio Anticipo</p>
                    <p className="text-sm font-medium">{invoice.anticipoFolio}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monto Deducido</p>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                      {formatCurrency(
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
                        ? formatCurrency(invoice.salario, invoice.currency)
                        : null
                    }
                  />
                  <InfoItem
                    label="Tipo de Fee"
                    value={
                      invoice.feeType
                        ? FeeTypeLabels[invoice.feeType] ?? invoice.feeType
                        : null
                    }
                  />
                  <InfoItem
                    label="Valor del Fee"
                    value={formatFee(invoice.feeType, invoice.feeValue)}
                  />
                </>
              )}
              <InfoItem label="Banco" value={invoice.banco} />
            </div>
          </div>

          <Separator />

          {/* Totales */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Totales
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(invoice.subtotal, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  IVA ({(invoice.ivaRate * 100).toFixed(0)}%)
                </span>
                <span className="font-medium">
                  {formatCurrency(invoice.ivaAmount, invoice.currency)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">
                  {formatCurrency(invoice.total, invoice.currency)}
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

          {/* PPD Complemento */}
          {isPPD && (
            <div className="pt-3 border-t">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Complemento de Pago (PPD)
              </h4>
              {invoice.complemento ? (
                <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                      >
                        Adjunto
                      </Badge>
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {invoice.complemento.fileName}
                      </span>
                    </div>
                    <a
                      href={invoice.complemento.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline shrink-0"
                    >
                      Ver / Descargar
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>
                      <span className="uppercase tracking-wide">Tamaño</span>
                      <p className="text-sm text-foreground mt-0.5">
                        {(invoice.complemento.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <div>
                      <span className="uppercase tracking-wide">Subido</span>
                      <p className="text-sm text-foreground mt-0.5">
                        {formatDateSafe(invoice.complemento.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 p-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                    >
                      Pendiente
                    </Badge>
                    <span className="text-sm text-amber-700 dark:text-amber-300">
                      Requiere complemento de pago antes de marcar como pagada
                    </span>
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
