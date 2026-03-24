"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Building04Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/shared/ui/shadcn/card";
import { Button } from "@/core/shared/ui/shadcn/button";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import type { ClientDTO } from "../../types/client.types";
import { cn } from "@/core/lib/utils";
import { EmptyState } from "./EmptyState";

interface ClientFiscalInfoProps {
  client: ClientDTO;
  onEdit: () => void;
}

function FiscalField({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string | null | undefined;
  fullWidth?: boolean;
}) {
  const isEmpty = !value;

  return (
    <div className={cn("space-y-1", fullWidth && "sm:col-span-2")}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-sm font-medium",
          isEmpty && "text-muted-foreground/50 italic",
        )}
      >
        {value || "Sin configurar"}
      </p>
    </div>
  );
}

export function ClientFiscalInfo({ client, onEdit }: ClientFiscalInfoProps) {
  const hasFiscalData =
    client.rfc !== null ||
    client.codigoPostalFiscal !== null ||
    client.nombreComercial !== null ||
    client.ubicacion !== null ||
    client.regimenFiscal !== null ||
    client.figura !== null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Información Fiscal</CardTitle>
          <PermissionGuard
            permissions={[
              PermissionActions.clientes.editar,
              PermissionActions.clientes.gestionar,
            ]}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon icon={PencilEdit01Icon} className="size-3.5" />
              Editar
            </Button>
          </PermissionGuard>
        </div>
      </CardHeader>
      <CardContent>
        {!hasFiscalData ? (
          <EmptyState
            icon={Building04Icon}
            title="No hay datos fiscales configurados"
            description="Agrega RFC, régimen fiscal y más datos para facturación"
            action={{
              label: "Configurar datos fiscales",
              onClick: onEdit,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FiscalField label="RFC" value={client.rfc} />
            <FiscalField
              label="Código Postal"
              value={client.codigoPostalFiscal}
            />
            <FiscalField
              label="Nombre Comercial"
              value={client.nombreComercial}
            />
            <FiscalField label="Régimen Fiscal" value={client.regimenFiscal} />
            <FiscalField label="Ubicación" value={client.ubicacion} fullWidth />
            <FiscalField label="Figura" value={client.figura} fullWidth />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
