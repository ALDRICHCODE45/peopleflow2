"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  MoneyBag02Icon,
  Calendar03Icon,
  Shield01Icon,
  Invoice01Icon,
  Building04Icon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/shared/ui/shadcn/card";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { Button } from "@/core/shared/ui/shadcn/button";
import { Skeleton } from "@/core/shared/ui/shadcn/skeleton";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { useClientById, useUpdateClientFiscalData } from "../hooks/useClient";
import { FiscalDataDialog } from "../components/FiscalDataDialog";
import {
  CurrencyLabels,
  PaymentSchemeLabels,
  AdvanceTypeLabels,
  FeeTypeLabels,
} from "../types/client.types";
import type { ClientDTO, FiscalDataFormData } from "../types/client.types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ClientDetailPageProps {
  clientId: string;
}

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

// --- Componente de campo label/value ---

function DetailField({
  label,
  value,
  badge,
}: {
  label: string;
  value: string | null | undefined;
  badge?: boolean;
}) {
  const displayValue = value || "—";

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      {badge && value ? (
        <Badge variant="secondary" className="text-sm font-medium">
          {displayValue}
        </Badge>
      ) : (
        <p className="text-sm font-medium">{displayValue}</p>
      )}
    </div>
  );
}

// --- Sección de Condiciones Comerciales ---

function CommercialTermsSection({ client }: { client: ClientDTO }) {
  const hasTerms = client.paymentScheme !== null;

  if (!hasTerms) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HugeiconsIcon icon={MoneyBag02Icon} className="size-5" />
            Condiciones Comerciales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <HugeiconsIcon
              icon={Invoice01Icon}
              className="size-12 text-muted-foreground/40 mb-3"
            />
            <p className="text-muted-foreground text-sm">
              No hay términos comerciales configurados
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Se configurarán cuando el lead avance a &quot;Posiciones
              Asignadas&quot;
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HugeiconsIcon icon={MoneyBag02Icon} className="size-5" />
          Condiciones Comerciales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <DetailField
            label="Moneda"
            value={
              client.currency
                ? (CurrencyLabels[client.currency] ?? client.currency)
                : null
            }
            badge
          />
          <DetailField
            label="Posiciones Iniciales"
            value={client.initialPositions?.toString()}
          />
          <DetailField
            label="Esquema de Pago"
            value={
              client.paymentScheme
                ? (PaymentSchemeLabels[client.paymentScheme] ??
                  client.paymentScheme)
                : null
            }
            badge
          />
          <DetailField
            label="Tipo de Fee"
            value={
              client.feeType
                ? (FeeTypeLabels[client.feeType] ?? client.feeType)
                : null
            }
          />
          <DetailField label="Valor del Fee" value={feeValueDisplay()} />
          <DetailField
            label="Días de Crédito"
            value={
              client.creditDays !== null ? `${client.creditDays} días` : null
            }
          />

          {/* Anticipo — solo si aplica */}
          {client.paymentScheme === "ADVANCE" && (
            <>
              <DetailField
                label="Tipo de Anticipo"
                value={
                  client.advanceType
                    ? (AdvanceTypeLabels[client.advanceType] ??
                      client.advanceType)
                    : null
                }
              />
              <DetailField
                label="Valor del Anticipo"
                value={advanceValueDisplay()}
              />
            </>
          )}

          <DetailField
            label="Fee de Cancelación"
            value={
              client.cancellationFee !== null
                ? formatCurrency(client.cancellationFee, client.currency)
                : null
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

// --- Sección de Garantía ---

function WarrantySection({ client }: { client: ClientDTO }) {
  if (client.warrantyMonths === null) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HugeiconsIcon icon={Shield01Icon} className="size-5" />
          Garantía
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DetailField
          label="Meses de Garantía"
          value={`${client.warrantyMonths} ${client.warrantyMonths === 1 ? "mes" : "meses"}`}
        />
      </CardContent>
    </Card>
  );
}

// --- Sección de Datos Fiscales ---

function FiscalDataSection({
  client,
  onEdit,
}: {
  client: ClientDTO;
  onEdit: () => void;
}) {
  const hasFiscalData =
    client.rfc !== null ||
    client.codigoPostalFiscal !== null ||
    client.nombreComercial !== null ||
    client.ubicacion !== null ||
    client.regimenFiscal !== null ||
    client.figura !== null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HugeiconsIcon icon={Building04Icon} className="size-5" />
            Datos Fiscales
          </CardTitle>
          <PermissionGuard
            permissions={[
              PermissionActions.clientes.editar,
              PermissionActions.clientes.gestionar,
            ]}
          >
            <Button variant="outline" size="sm" onClick={onEdit}>
              <HugeiconsIcon icon={PencilEdit01Icon} className="size-4 mr-1" />
              Editar
            </Button>
          </PermissionGuard>
        </div>
      </CardHeader>
      <CardContent>
        {!hasFiscalData ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <HugeiconsIcon
              icon={Building04Icon}
              className="size-12 text-muted-foreground/40 mb-3"
            />
            <p className="text-muted-foreground text-sm">
              No hay datos fiscales configurados
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Haz clic en &quot;Editar&quot; para agregar los datos fiscales
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <DetailField label="RFC" value={client.rfc} />
            <DetailField
              label="Código Postal Fiscal"
              value={client.codigoPostalFiscal}
            />
            <DetailField
              label="Nombre Comercial"
              value={client.nombreComercial}
            />
            <DetailField
              label="Régimen Fiscal"
              value={client.regimenFiscal}
            />
            <div className="sm:col-span-2">
              <DetailField label="Ubicación" value={client.ubicacion} />
            </div>
            <div className="sm:col-span-2">
              <DetailField label="Figura" value={client.figura} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Sección de Info General ---

function GeneralInfoSection({ client }: { client: ClientDTO }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HugeiconsIcon icon={Calendar03Icon} className="size-5" />
          Información General
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <DetailField label="Generador" value={client.generadorName} />
          <DetailField label="Origen" value={client.origenName} />
          <DetailField label="Creado por" value={client.createdByName} />
          <DetailField
            label="Fecha de Creación"
            value={format(new Date(client.createdAt), "dd MMM yyyy", {
              locale: es,
            })}
          />
          <DetailField
            label="Última Actualización"
            value={format(new Date(client.updatedAt), "dd MMM yyyy", {
              locale: es,
            })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// --- Loading skeleton ---

function ClientDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-64" />
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

// --- Page principal ---

export function ClientDetailPage({ clientId }: ClientDetailPageProps) {
  const { data: client, isLoading, error } = useClientById(clientId);
  const [fiscalDialogOpen, setFiscalDialogOpen] = useState(false);
  const updateFiscalData = useUpdateClientFiscalData();

  const handleFiscalDataSubmit = (data: FiscalDataFormData) => {
    if (!client) return;

    updateFiscalData.mutate(
      {
        clientId: client.id,
        fiscalData: {
          rfc: data.rfc.trim() || null,
          codigoPostalFiscal: data.codigoPostalFiscal.trim() || null,
          nombreComercial: data.nombreComercial.trim() || null,
          ubicacion: data.ubicacion.trim() || null,
          regimenFiscal: data.regimenFiscal.trim() || null,
          figura: data.figura.trim() || null,
        },
      },
      {
        onSuccess: () => {
          setFiscalDialogOpen(false);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-5xl">
        <ClientDetailSkeleton />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="container mx-auto py-8 max-w-5xl">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-sm">
            {error?.message ?? "No se encontró el cliente"}
          </p>
          <Link
            href="/finanzas/clientes"
            className="text-primary text-sm mt-2 hover:underline"
          >
            Volver a la lista de clientes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/finanzas/clientes"
          className="flex items-center justify-center size-9 rounded-md border hover:bg-accent transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{client.nombre}</h1>
          <p className="text-sm text-muted-foreground">Detalle del cliente</p>
        </div>
      </div>

      {/* Condiciones comerciales */}
      <CommercialTermsSection client={client} />

      {/* Garantía */}
      <WarrantySection client={client} />

      {/* Datos Fiscales */}
      <FiscalDataSection
        client={client}
        onEdit={() => setFiscalDialogOpen(true)}
      />

      {/* Info general */}
      <GeneralInfoSection client={client} />

      {/* Dialog de Datos Fiscales */}
      <FiscalDataDialog
        open={fiscalDialogOpen}
        onOpenChange={setFiscalDialogOpen}
        client={client}
        onSubmit={handleFiscalDataSubmit}
        isSubmitting={updateFiscalData.isPending}
      />
    </div>
  );
}
