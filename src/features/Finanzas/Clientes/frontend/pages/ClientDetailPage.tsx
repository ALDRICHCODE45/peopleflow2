"use client";

import { useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/core/shared/ui/shadcn/skeleton";
import { useClientById, useUpdateClientFiscalData } from "../hooks/useClient";
import { FiscalDataDialog } from "../components/FiscalDataDialog";
import { ClientSheetForm } from "../components/ClientSheetForm";
import { ClientHeader } from "../components/detail/ClientHeader";
import { ClientStatsCards } from "../components/detail/ClientStatsCards";
import { ClientCommercialInfo } from "../components/detail/ClientCommercialInfo";
import { ClientFiscalInfo } from "../components/detail/ClientFiscalInfo";
import { ClientFinancialSummary } from "../components/detail/ClientFinancialSummary";
import { ClientContacts } from "../components/detail/ClientContacts";
import type { FiscalDataFormData } from "../types/client.types";

interface ClientDetailPageProps {
  clientId: string;
}

// --- Loading skeleton ---

function ClientDetailSkeleton() {
  return (
    <div className="space-y-0">
      {/* Header skeleton */}
      <div className="bg-muted/30 dark:bg-muted/10 border-b px-4 md:px-6 lg:px-8 py-5 md:py-6">
        <Skeleton className="h-4 w-16 mb-4" />
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 md:size-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-56 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Page principal ---

export function ClientDetailPage({ clientId }: ClientDetailPageProps) {
  const { data: client, isLoading, error } = useClientById(clientId);
  const [fiscalDialogOpen, setFiscalDialogOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
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
    return <ClientDetailSkeleton />;
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
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
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <ClientHeader client={client} onEdit={() => setEditSheetOpen(true)} />

      {/* Main Content */}
      <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Cards Row */}
        <ClientStatsCards />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column — ~60% */}
          <div className="lg:col-span-3 space-y-6">
            <ClientCommercialInfo client={client} />
            <ClientFiscalInfo
              client={client}
              onEdit={() => setFiscalDialogOpen(true)}
            />
          </div>

          {/* Right Column — ~40% */}
          <div className="lg:col-span-2 space-y-6">
            <ClientFinancialSummary />
            <ClientContacts />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <FiscalDataDialog
        open={fiscalDialogOpen}
        onOpenChange={setFiscalDialogOpen}
        client={client}
        onSubmit={handleFiscalDataSubmit}
        isSubmitting={updateFiscalData.isPending}
      />

      <ClientSheetForm
        client={client}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
      />
    </div>
  );
}
