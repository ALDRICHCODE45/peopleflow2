"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Briefcase01Icon } from "@hugeicons/core-free-icons";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/shared/ui/shadcn/card";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import {
  CurrencyLabels,
  PaymentSchemeLabels,
  AdvanceTypeLabels,
  FeeTypeLabels,
} from "../../types/client.types";
import type { ClientDTO } from "../../types/client.types";
import { cn } from "@/core/lib/utils";
import { EmptyState } from "./EmptyState";

interface ClientCommercialInfoProps {
  client: ClientDTO;
}

// --- Color maps (only for badges) ---

const currencyColorMap: Record<string, string> = {
  MXN: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  USD: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

const schemeColorMap: Record<string, string> = {
  SUCCESS_100:
    "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  ADVANCE: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

// --- Helper para formatear valores monetarios ---

function formatCurrency(value: number | null, currency: string | null): string {
  if (value === null || value === undefined) return "—";
  const cur = currency ?? "MXN";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: cur,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

// --- Field component (text only, no badge) ---

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  const isEmpty = !value;

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-sm font-medium",
          isEmpty && "text-muted-foreground/50 italic",
        )}
      >
        {value || "—"}
      </p>
    </div>
  );
}

// --- Badge field (only for Moneda + Esquema) ---

function BadgeField({
  label,
  value,
  badgeClassName,
}: {
  label: string;
  value: string | null | undefined;
  badgeClassName?: string;
}) {
  const isEmpty = !value;

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      {!isEmpty && badgeClassName ? (
        <Badge
          className={cn(
            "font-medium rounded-sm inline-flex items-center gap-1.5 px-2.5 whitespace-nowrap border-0",
            badgeClassName,
          )}
        >
          <span className="h-[6px] w-[6px] rounded-full bg-current shrink-0" />
          {value}
        </Badge>
      ) : (
        <p className="text-sm font-medium text-muted-foreground/50 italic">—</p>
      )}
    </div>
  );
}

export function ClientCommercialInfo({ client }: ClientCommercialInfoProps) {
  const hasCommercialData =
    client.currency !== null ||
    client.paymentScheme !== null ||
    client.feeType !== null ||
    client.creditDays !== null;

  const feeValueDisplay = (): string => {
    if (client.feeValue === null) return "—";
    if (client.feeType === "PERCENTAGE") return `${client.feeValue}%`;
    if (client.feeType === "MONTHS")
      return `${client.feeValue} ${client.feeValue === 1 ? "mes" : "meses"}`;
    return formatCurrency(client.feeValue, client.currency);
  };

  const advanceValueDisplay = (): string => {
    if (client.advanceValue === null) return "—";
    if (client.advanceType === "PERCENTAGE") return `${client.advanceValue}%`;
    return formatCurrency(client.advanceValue, client.currency);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Información Comercial</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasCommercialData ? (
          <EmptyState
            icon={
              <HugeiconsIcon
                icon={Briefcase01Icon}
                className="size-10"
                strokeWidth={1.5}
              />
            }
            title="No hay información comercial"
            description="Configura los términos comerciales del cliente"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoField label="Origen" value={client.origenName} />
            <BadgeField
              label="Moneda"
              value={
                client.currency
                  ? (CurrencyLabels[client.currency] ?? client.currency)
                  : null
              }
              badgeClassName={
                client.currency
                  ? (currencyColorMap[client.currency] ?? undefined)
                  : undefined
              }
            />
            <InfoField
              label="Fee"
              value={
                client.feeType
                  ? `${feeValueDisplay()} (${FeeTypeLabels[client.feeType] ?? client.feeType})`
                  : null
              }
            />
            <InfoField
              label="Días de Crédito"
              value={
                client.creditDays !== null ? `${client.creditDays} días` : null
              }
            />
            <BadgeField
              label="Esquema de Pago"
              value={
                client.paymentScheme
                  ? (PaymentSchemeLabels[client.paymentScheme] ??
                    client.paymentScheme)
                  : null
              }
              badgeClassName={
                client.paymentScheme
                  ? (schemeColorMap[client.paymentScheme] ?? undefined)
                  : undefined
              }
            />
            <InfoField
              label="Garantía"
              value={
                client.warrantyMonths !== null
                  ? `${client.warrantyMonths} ${client.warrantyMonths === 1 ? "mes" : "meses"}`
                  : null
              }
            />

            {/* Anticipo — solo si esquema es ADVANCE */}
            {client.paymentScheme === "ADVANCE" && (
              <InfoField
                label="Anticipo"
                value={
                  client.advanceType
                    ? `${advanceValueDisplay()} (${AdvanceTypeLabels[client.advanceType] ?? client.advanceType})`
                    : null
                }
              />
            )}

            <InfoField
              label="Fee de Cancelación"
              value={
                client.cancellationFee !== null
                  ? formatCurrency(client.cancellationFee, client.currency)
                  : null
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
